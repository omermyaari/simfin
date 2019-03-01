const rp = require('request-promise'),
    Joi = require('joi');

const statementTypes = ['pl', 'bs', 'cf'],
    periodTypes = ['Q1', 'Q2', 'Q3', 'Q4', 'H1', 'H2', '9M', 'FY'],
    indicatorsMap = {
        '0-3': 'Number of employees',
        '0-5': 'Founding year',
        '0-6': 'Headquarter location',
        '0-73': 'Sector classification',
        '0-71': 'Ticker',
        '0-31': 'Last closing price',
        '4-11': 'Market capitalisation',
        '0-64': 'Common shares outstanding',
        '0-65': 'Preferred shares outstanding',
        '0-66': 'Average shares outstanding, basic',
        '0-67': 'Average shares outstanding, diluted',
        '1-1': 'Revenues',
        '1-2': 'Cost of goods sold',
        '1-4': 'Gross profit',
        '1-11': 'Operating expenses',
        '1-12': 'Selling, general and administrative',
        '1-15': 'Research and development expenses',
        '1-19': 'Operating income (EBIT)',
        '4-10': 'EBITDA',
        '1-21': 'Net interest expense',
        '1-28': 'Pretax income (adjusted)',
        '1-43': 'Pretax income',
        '1-44': 'Income taxes',
        '1-49': 'Income from continuing operations',
        '1-58': 'Net income (common shareholders)',
        '2-1': 'Cash and cash-equivalents',
        '2-5': 'Net receivables',
        '2-21': 'Total current assets',
        '2-22': 'Net property, plant and equipment',
        '2-41': 'Total assets',
        '2-43': 'Accounts payable',
        '2-47': 'Current debt',
        '2-57': 'Total current liabilities',
        '2-58': 'Non current debt',
        '4-6': 'Total debt',
        '2-73': 'Total liabilities',
        '2-74': 'Preferred equity',
        '2-76': 'Common stock',
        '2-82': 'Equity before minorities',
        '2-83': 'Minority interest',
        '3-2': 'Depreciation and amortisation',
        '3-7': 'Change in working capital',
        '3-13': 'Operating cash flow',
        '3-14': 'Net change in PP & E and intangibles',
        '3-31': 'Investing cash flow',
        '3-32': 'Dividends paids',
        '3-43': 'Financing cash flow',
        '3-46': 'Net change in cash',
        '4-25': 'Free cash flow',
        '4-0': 'Gross margin',
        '4-1': 'Operating margin',
        '4-2': 'Net profit margin',
        '4-7': 'Return on equity',
        '4-9': 'Return on assets',
        '4-28': 'Free cash flow to net income',
        '4-3': 'Current ratio',
        '4-4': 'Liabilities to equity ratio',
        '4-5': 'Debt to assets ratio',
        '4-12': 'Earnings per share, basic',
        '4-13': 'Earnings per share, diluted',
        '4-17': 'Sales per share',
        '4-18': 'Book value per share',
        '4-26': 'Free cash flow per share',
        '4-29': 'Dividends per share',
        '4-14': 'Price to earnings ratio',
        '4-15': 'Price to sales ratio',
        '4-16': 'Price to book value',
        '4-27': 'Price to free cash flow',
        '4-20': 'Enterprise value',
        '4-21': 'EV/EBITDA',
        '4-22': 'EV/Sales',
        '4-31': 'EV/FCF',
        '4-23': 'Book to market value',
        '4-24': 'Operating income / EV',
        '4-30': 'Pietroski F-Score'
    };

//  SimFin API parameters.
const simfinParameters = {
    ticker: Joi.string().alphanum().min(2).max(10),
    companyId: Joi.number().integer(),
    indicators: Joi.array().items(
        Joi.string().regex(/^[0-4]-(\d){1,2}$/)
    ),
    statementType: Joi.string().valid(statementTypes),
    periodType: Joi.alternatives().try([
        Joi.string().valid(periodTypes),
        Joi.string().regex(/^TTM(-(\d){1,2}(\.(0|25|5|50|75))?)?$/)
    ]),
    fiscalYear: Joi.number().integer().min(1900).max(2018)
};

//  Company statements request validation schema.
const statementRequestSchema = Joi.object().keys({
    companyId: simfinParameters.companyId.required(),
    statementType: simfinParameters.statementType.required(),
    periodType: simfinParameters.periodType.required(),
    fiscalYear: simfinParameters.fiscalYear.required()
});

//  Company TTM financial ratios request validation schema
const ttmFinancialRatiosRequestSchema = Joi.object().keys({
    companyId: simfinParameters.companyId.required(),
    indicators: simfinParameters.indicators
});

class SimFin {

    constructor(token) {
        this.baseURL = 'https://simfin.com/api/v1/';
        this.token = token;
    }

    /**
     * Sends out a HTTP request, given the route, method and query params.
     *
     * @param {string} route - The api route.
     * @param {string} method - The HTTP method.
     * @param {object} params - Query parameters object.
     * @returns {promise} - The request promise.
     * @memberof SimFin
     */
    async makeRequest(route, method, params) {

        const options = {
            method,
            uri: this.baseURL + route,
            qs: {
                'api-key': this.token,
                ...params
            },
            json: true
        };

        return rp(options);
    }

    /**
     * Returns the Simfin id for the company, given it's ticker.
     *
     * @param {string} ticker - The company's ticker (e.g. AAPL).
     * @returns {promise} - An array with an object that contains the name of the company, it's Simfin id and it's ticker.
     * @memberof SimFin
     */
    async getCompanyIdByTicker(ticker) {

        const { error } = Joi.validate(ticker, simfinParameters.ticker);

        if (error !== null) {
            return Promise.reject(error);
        }

        return this.makeRequest(`info/find-id/ticker/${ticker}`, 'GET');
    }

    /**
     * Returns the Simfin id for the company, given it's name.
     *
     * @param {string} name - The company's name (e.g. Apple Inc).
     * @returns {promise} - An array with an object that contains the name of the company, it's Simfin id and it's ticker.
     * @memberof SimFin
     */
    async getCompanyIdByName(name) {
        return this.makeRequest(`info/find-id/name-search/${name}`, 'GET');
    }

    /**
     * Returns a list of all available Simfin companies.
     *
     * @returns {promise} - An array that contains companies.
     * @memberof SimFin
     */
    async getAllCompanies() {
        return this.makeRequest('info/all-entities', 'GET');
    }

    /**
     * Returns general company data given it's Simfin id.
     *
     * @param {number} companyId - The company's Simfin id.
     * @returns {promise} - The company data.
     * @memberof SimFin
     */
    async getCompanyDataById(companyId) {
        return this.makeRequest(`companies/id/${companyId}`, 'GET');
    }

    /**
     * Returns all available statements for the company, given it's Simfin id.
     * 
     * Statement types available: 
     *      P&L (profit and loss),
     *      BS (balance sheets),
     *      CF (cash flow statements).
     *
     * @param {number} companyId - The company's Simfin id.
     * @returns {promise} - An object that contains the available statement lists.
     * @memberof SimFin
     */
    async getAvailableCompanyStatements(companyId) {
        return this.makeRequest(`companies/id/${companyId}/statements/list`, 'GET');
    }

    /**
     * Returns the company statement data, given it's Simfin id, statement type, period type and fiscal year.
     *
     * @param {number} companyId - The company's Simfin id.
     * @param {string} statementType - The statement type (e.g. pl, bs, cf).
     * @param {string} periodType - The period type (e.g. Q1, Q2, Q3, Q4, H1, H2, 9M, FY, TTM, TTM-{offset}).
     * @param {number} fiscalYear - The fiscal year (e.g. 2018).
     * @param {boolean} standardised - Indicates whether to get the non-standardised, or the standardised statement data, defaults to false.
     * @returns {promise} - An object that contains the statement data.
     * @memberof SimFin
     */
    async getStatementData(companyId, statementType, periodType, fiscalYear, standardised = false) {

        const { error } = Joi.validate({ companyId, statementType, periodType, fiscalYear }, statementRequestSchema);

        let params,
            url;

        if (error !== null) {
            return Promise.reject(error);
        }

        params = {
            stype: statementType,
            ptype: periodType,
            fyear: fiscalYear
        };

        url = `companies/id/${companyId}/statements/`;

        standardised ? url += 'standardised' : url += 'original';

        return this.makeRequest(url, 'GET', params);
    }

    /**
     * Returns the company TTM financial ratios, given it's Simfin id and indicators
     *
     * @param {number} companyId - The company's Simfin id.
     * @param {object} indicators - An array of company indicator ids.
     * @returns {promise} - An array that contains indicator objects.
     * @memberof SimFin
     */
    async getTTMFinancialRatios(companyId, indicators) {

        const { error } = Joi.validate({ companyId, indicators }, ttmFinancialRatiosRequestSchema);

        let params;

        if (error !== null) {
            return Promise.reject(error);
        }

        if (indicators) {
            params = {
                indicators: indicators.join(',')
            };
        }

        return this.makeRequest(`companies/id/${companyId}/ratios`, 'GET', params);
    }

    /**
     * Returns all available indicators.
     *
     * @returns {object} - A map containing indicator ids and their descriptions.
     * @memberof SimFin
     */
    getFinancialIndicators() {
        return indicatorsMap;
    }

    /**
     * Returns all available statement types.
     *
     * @returns {object} - An array containing the avaialble statement types.
     * @memberof SimFin
     */
    getStatementTypes() {
        return statementTypes;
    }

    /**
     * Returns all available period types.
     *
     * @returns {object} - An array containing the available period types.
     * @memberof SimFin
     */
    getPeriodTypes() {
        return periodTypes;
    }
}

module.exports = SimFin;