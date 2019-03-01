const expect = require('expect');

const SimFin = require('../index');

const token = process.env.SIMFIN_TOKEN,
    httpbinBaseURL = 'http://httpbin.org';

describe('simfin tests', () => {

    let simfinInstance,
        simfinId,
        method,
        route,
        params,
        result,
        expectedResult;

    beforeEach(() => {
        simfinInstance = new SimFin(token);
    });

    describe('makeRequest function tests', () => {

        it('should make a HTTP GET request', async () => {

            simfinInstance.baseURL = httpbinBaseURL;
            method = 'GET';
            route = '/get';

            result = await simfinInstance.makeRequest(route, method);

            expectedResult = `${httpbinBaseURL}/get`;

            expect(result).toHaveProperty('url');
        });

        it('should make a HTTP GET request with query parameters', async () => {

            simfinInstance.baseURL = httpbinBaseURL;
            method = 'GET';
            route = '/get';
            params = {
                hello: 'world'
            };

            result = await simfinInstance.makeRequest(route, method, params);

            expectedResult = {
                ...params,
                'api-key': token
            };

            expect(result).toHaveProperty('args', expectedResult);
        });
    });

    describe('getCompanyIdByTicker function', () => {

        it('should get the company simfin id given the ticker', async () => {

            params = 'AAPL';

            result = await simfinInstance.getCompanyIdByTicker(params);

            result = result[0];

            expectedResult = params;

            simfinId = result.simId;

            expect(result).toHaveProperty('ticker', expectedResult);
        });
    })

    describe('getCompanyIdByName function', () => {

        it('should get the company simfin id given the name', async () => {

            params = 'Apple';

            result = await simfinInstance.getCompanyIdByName(params);

            result = result[0];

            expectedResult = 'AAPL';

            simfinId = result.simId;

            expect(result).toHaveProperty('ticker', expectedResult);
        });
    });

    describe('getAllCompanies function', () => {

        it('should get all company entities', async () => {

            result = await simfinInstance.getAllCompanies();

            expect(Array.isArray(result)).toBeTruthy();
        });
    });

    describe('getCompanyDataById function', () => {

        it('should get the company data given its simfin id', async () => {

            result = await simfinInstance.getCompanyDataById(simfinId);

            expectedResult = 'AAPL';

            expect(result).toHaveProperty('ticker', expectedResult);
        });
    });

    describe('getAvailableCompanyStatements function', () => {

        it('should get all available company statements, given its simfin id', async () => {

            result = await simfinInstance.getAvailableCompanyStatements(simfinId);

            expect(result).toHaveProperty('pl');
            expect(Array.isArray(result.pl)).toBeTruthy();
            expect(result).toHaveProperty('bs');
            expect(Array.isArray(result.bs)).toBeTruthy();
            expect(result).toHaveProperty('cf');
            expect(Array.isArray(result.cf)).toBeTruthy();
        });
    });
});
