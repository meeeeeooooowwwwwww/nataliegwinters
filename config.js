const env = process.env.NODE_ENV || 'development';

const configs = {
    development: {
        baseUrl: 'http://localhost:8080',
        articlesPath: 'warroom-articles',
        defaultImage: 'assets/images/social-header.jpg'
    },
    staging: {
        baseUrl: 'https://staging.nataliegwinters.com',
        articlesPath: 'warroom-articles',
        defaultImage: 'assets/images/social-header.jpg'
    },
    production: {
        baseUrl: 'https://nataliegwinters.com',
        articlesPath: 'warroom-articles',
        defaultImage: 'assets/images/social-header.jpg'
    }
};

// Allow overriding baseUrl through environment variable
if (process.env.BASE_URL) {
    configs[env].baseUrl = process.env.BASE_URL;
}

module.exports = configs[env]; 