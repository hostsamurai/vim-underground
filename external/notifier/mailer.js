var Consumer = require('../consumer/consumer'),
    env = process.argv[2],
    ArticleConsumer = new Consumer.ArticleConsumer(env).configure();

ArticleConsumer.listenForChanges({ since: 2, filter: 'newest' });
