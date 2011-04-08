var Consumer = require('../consumer/consumer'),
    env = process.argv[2],
    feedConsumer = new Consumer.FeedConsumer(env).configure();

feedConsumer.listenForChanges('vim-script-feed', { since: 2, filter: 'feed' });
