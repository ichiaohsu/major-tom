const {getDeployVersion, uploadDist, patchDeployment} = require('./k8s.js');

module.exports = function(robot) {
    robot.respond(/assemble/i, (msg) => {
        msg.send('I am Tor');
    });

    robot.respond(/version\s+rr\s+(readr-site-mobile|readr-site|news-projects|readr-restful)/i, async (msg) => {
        const deployName = msg.match[1];

        try {
            const version = await getDeployVersion('default', deployName);
            msg.send(`${deployName} is using ${version}`);
        } catch (err) {
            msg.send(err);
        }
    });

    robot.respond(/deploy\s+rr\s+(readr-site-mobile|readr-site|news-projects-canary|news-projects|readr-restful)\s+(.+)/i, async (msg) => {
        msg.send('launching deploy sequences');
        const deployName = msg.match[1];
        const versionTag = msg.match[2];
        const isFrontend = deployName !== 'readr-restful';

        const fullImage = 'gcr.io/mirrormedia-1470651750304/' + deployName + ':' + versionTag;

        // check if version in the pattern master*
        if (isFrontend) {
            if ( !versionTag.startsWith('master') ) {
                return msg.send('invalid version. news-projects version should start with master');
            }
        }

        try {
            await patchDeployment('default', deployName, {
                body: {
                    spec: {
                        template: {
                            spec: {
                                containers: [{
                                    name: deployName,
                                    image: fullImage,
                                }],
                            },
                        },
                    },
                },
            });
            msg.send(`${deployName} updated`);
        } catch (err) {
            msg.send(`Update deployment ${deployName} error: `, err);
        }
    });

    robot.respond(/upload\s+dist\s+rr\s+(readr-site-mobile|readr-site|news-projects)\s+(.+)/i, async (msg) => {
        const deployName = msg.match[1];
        const fullImage = 'gcr.io/mirrormedia-1470651750304/' + deployName + ':' + msg.match[2];
        const canaryName = `${deployName}-canary`;
        let distribution;

        switch (deployName) {
        case 'readr-site-mobile':
            distribution = 'distribution';
            break;
        case 'readr-site':
            distribution = 'distribution';
            break;
        case 'news-projects':
            distribution = 'dist';
            break;
        }
        try {
            await uploadDist('dist', canaryName, fullImage, distribution);
            msg.send('dist uploaded.');
        } catch (err) {
            msg.send(err);
        }
    });
};

