const fs = require('fs');

const getValues = (path = '.env') =>
  fs
    .readFileSync(path, {encoding: 'utf-8'})
    .trim()
    .split('\n')
    .map(line => line.split(/=(.*)/))
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

class ServerlessOfflineSSMProvider {
  constructor(serverless) {
    this.serverless = serverless;
    this.config = this.serverless.service.custom['serverless-offline-ssm-provider'];
    
    try {
     this.values = getValues(this.config.file);
    } catch(e) {
      this.values = {};
    }

    const aws = this.serverless.getProvider('aws');
    const request = aws.request.bind(aws);
    const stage = process.env.STAGE;

    aws.request = (service, method, params, options) => {
      if (service !== 'SSM' || method !== 'getParameter' || stage !== 'local')
        return request(service, method, params, options);

      return Promise.resolve({
        Parameter: {
          Value: this.values[params.Name]
        }
      });
    };

    this.serverless.setProvider('aws', aws);
  }
}

module.exports = ServerlessOfflineSSMProvider;
