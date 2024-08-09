var fs = require("fs");

require("dotenv").config();



const Discord = require("discord.js");

const client = new Discord.Client({
    intents: 32767, // all intents
    partials: ['CHANNEL', 'GUILD_MEMBER', 'GUILD_SCHEDULED_EVENT', 'MESSAGE', 'REACTION', 'USER'] // all partials

});

client.commands = new Discord.Collection();

client.login(process.env.BOTTOKEN);



const commandFiles = fs

    .readdirSync("./commands")

    .filter(file => file.endsWith(".js"));



for (const file of commandFiles) {

    const command = require(`./commands/${file}`);

    client.commands.set(command.name, command);

}



let servers = ["SYN", "GOTT",/*"RAT"*/, "ILL_GREEN", "ILL_PURPLE","FEINTED", "FIX"];



let configs = [];



client.on("ready", async () => {

    console.log(`Logged in as ${client.user.tag}!`);

    const schedule = require("node-schedule");

    servers.forEach((server) => {

        fs.readFile("./Config_" + server + ".json", "utf8", (err, data) => {

            if (err) {
                console.log(`Error reading file from disk: ${err}`);
            } else {
                let scrims = JSON.parse(data);

                configs.push({
                    id: process.env[server],
                    config: scrims
                });

                scrims.scrims.forEach((scrim) => {

                    if (scrim.activate_schedules == true) {
                        scheduleAutomaticActions(scrim, schedule, client, scrims);
                    }
                });


            }
        });
    });



});



client.on("message", msg => {

    try {

        let command = msg.content;

        if (msg.content.toLowerCase().includes("free slot") && !msg.author.bot) {

            configs.forEach((server) => {
                server.config.scrims.forEach((scrim) => {
                    if (server.id == msg.channel.guild.id && msg.channel.id == scrim.channel_Chat) {
                        msg.reply("for " + scrim.text_free_slots + " we have **__" + (scrim.max_number_of_teams - scrim.number_of_teams) + "__** free slots.").catch(err => console.error("Error happened."));
                    }
                });
            });
        }

        if (msg.content.startsWith("%registerVIP")) {
            command = "%registerVIP";
        } else if (msg.content.startsWith("%register")) {

            configs.forEach((server) => {
                server.config.scrims.forEach((scrim) => {
                    try {

                        if (server.id == msg.channel.guild.id && (msg.channel.id == scrim.channel_Registrations || msg.channel.id == scrim.channel_Waitlist)) {
                            command = "%register";
                        }

                    } catch (error) {

                        console.error(error);

                    }

                });

            });

        }

        if (msg.content.startsWith("%clear")) {
            command = "%clear";
        }

        if (msg.content.startsWith("%yes")) {
            command = "%yes";
        }

        if (!client.commands.has(command)) {

            return;

        } else {

            try {



                var currentdate = new Date();

                // currentdate.toLocaleString('en-US', { timeZone: 'CEST' });

                var datetime = "_" + currentdate.getDate() + "."

                    + (currentdate.getMonth() + 1) + "."

                    + currentdate.getFullYear() + ". at "

                    + ((currentdate.getHours() + 2) < 10 ? "0" + (currentdate.getHours() + 2) : currentdate.getHours() + 2) + ":"

                    + (currentdate.getMinutes() < 10 ? "0" + currentdate.getMinutes() : currentdate.getMinutes()) + " CEST_";



                configs.forEach((server) => {

                    if (server.id == msg.channel.guild.id) {

                        client.commands.get(command).execute(msg, server, client);



                        client.channels.fetch(server.config.channel_Logs).then(channel => {

                            channel.send("**" + msg.author.username + "#" + msg.author.discriminator + "** used `" + (command == "%clear" || command == "%yes" ? msg.content : command) + "` in <#" + msg.channel + "> - " + datetime

                                + (command == "%register" ? "\n\n" + ">>> " + msg.content : "")).catch(err => console.error("Error happened."));

                        });

                    }



                    if (!msg.content.startsWith("%register") && msg.content != "%del" && !msg.author.bot) {



                        msg.delete({ timeout: 3000 }).catch(err => { });



                    }



                });

            } catch (error) {

                console.error(error);

            }

        }

    } catch (error) {

        console.error(error);

    }

});



client.on("messageReactionAdd", async (reaction, user) => {

    if (user.bot) return;



    var currentdate = new Date();

    // currentdate.toLocaleString('en-US', { timeZone: 'CEST' });

    var datetime = "_" + currentdate.getDate() + "."

        + (currentdate.getMonth() + 1) + "."

        + currentdate.getFullYear() + ". at "

        + ((currentdate.getHours() + 2) < 10 ? "0" + (currentdate.getHours() + 2) : currentdate.getHours() + 2) + ":"

        + (currentdate.getMinutes() < 10 ? "0" + currentdate.getMinutes() : currentdate.getMinutes()) + " CEST_";



    configs.forEach((server) => {

        if (server.id == reaction.message.channel.guild.id) {
            client.commands.get("%reactConfirmation").execute(reaction, user, server, client);

            server.config.scrims.forEach((scrim) => {

                if (reaction.message.id == scrim.msg_Confirmation) {

                    client.channels.fetch(server.config.channel_Logs).then(channel => {

                        channel.send("**" + user.username + "#" + user.discriminator + "** `" + (reaction.emoji.id == server.config.reaction_correct ? "confirmed slot" : "canceled slot") + "` - " + datetime).catch(err => console.error("Error happened."));

                    });

                }

            });

        }

    });



});



function scheduleAutomaticActions(config, schedule, client, server) {

    const ruleClearAll = new schedule.RecurrenceRule();



    ruleClearAll.dayOfWeek = config.schedules.clear_all.dayOfWeek;

    ruleClearAll.hour = config.schedules.clear_all.hour;

    ruleClearAll.minute = config.schedules.clear_all.minute;

    ruleClearAll.tz = "Europe/Belgrade";



    schedule.scheduleJob(ruleClearAll, function () {

        client.channels.fetch(config.channel_Confirmations).then(channel => {

            channel.send("%sheet").catch(err => console.error("Error happened."));
            channel.send("%clear all").catch(err => console.error("Error happened."));

            setTimeout(() => {

                channel.send("%del").catch(err => console.error("Error happened."));

            }, 3000);

        });



        client.channels.fetch(config.channel_Registrations).then(channel => {

            channel.send("%del").catch(err => console.error("Error happened."));

        });



        client.channels.fetch(config.channel_IDPW).then(channel => {

            channel.send("%del").catch(err => console.error("Error happened."));

        });



        client.channels.fetch(config.channel_Waitlist).then(channel => {

            channel.send("%del").catch(err => console.error("Error happened."));

        });

    });



    const ruleOpenEarlyRegistrations = new schedule.RecurrenceRule();



    ruleOpenEarlyRegistrations.dayOfWeek = config.schedules.open_early_regs.dayOfWeek;

    ruleOpenEarlyRegistrations.hour = config.schedules.open_early_regs.hour;

    ruleOpenEarlyRegistrations.minute = config.schedules.open_early_regs.minute;

    ruleOpenEarlyRegistrations.tz = "Europe/Belgrade";



    schedule.scheduleJob(ruleOpenEarlyRegistrations, function () {

        client.channels.fetch(config.channel_Registrations).then(channel => {

            channel.send("%early").then(msg => {

                msg.delete({ timeout: 500 })

            }).catch(err => console.error("Error happened."));

        });

    });



    const ruleOpenRegistrations = new schedule.RecurrenceRule();



    ruleOpenRegistrations.dayOfWeek = config.schedules.open_regs.dayOfWeek;

    ruleOpenRegistrations.hour = config.schedules.open_regs.hour;

    ruleOpenRegistrations.minute = config.schedules.open_regs.minute;

    ruleOpenRegistrations.tz = "Europe/Belgrade";



    schedule.scheduleJob(ruleOpenRegistrations, function () {

        client.channels.fetch(config.channel_Registrations).then(channel => {

            channel.send("%open").then(msg => {

                msg.delete({ timeout: 500 })

            }).catch(err => console.error("Error happened."));


        });

    });



    const ruleOpenConfirmations = new schedule.RecurrenceRule();



    ruleOpenConfirmations.dayOfWeek = config.schedules.open_confirmations.dayOfWeek;

    ruleOpenConfirmations.hour = config.schedules.open_confirmations.hour;

    ruleOpenConfirmations.minute = config.schedules.open_confirmations.minute;

    ruleOpenConfirmations.tz = "Europe/Belgrade";



    schedule.scheduleJob(ruleOpenConfirmations, function () {

        client.channels.fetch(config.channel_Confirmations).then(channel => {

            channel.send("%confirm").then(msg => {

                msg.delete({ timeout: 500 })

            }).catch(err => console.error("Error happened."));

        });

    });



    const ruleCloseRegistrations = new schedule.RecurrenceRule();



    ruleCloseRegistrations.dayOfWeek = config.schedules.close_regs.dayOfWeek;

    ruleCloseRegistrations.hour = config.schedules.close_regs.hour;

    ruleCloseRegistrations.minute = config.schedules.close_regs.minute;

    ruleCloseRegistrations.tz = "Europe/Belgrade";



    schedule.scheduleJob(ruleCloseRegistrations, function () {

        client.channels.fetch(config.channel_Registrations).then(channel => {

            channel.send("%lock").then(msg => {

                msg.delete({ timeout: 500 })

            }).catch(err => console.error("Error happened."));

        });

    });

    if (config.remove_unconfirmed == true) {
        console.log("ruleRemoveUnconfirmed");
        const ruleRemoveUnconfirmed = new schedule.RecurrenceRule();
        ruleRemoveUnconfirmed.dayOfWeek = config.schedules.remove_unconfirmed.dayOfWeek;
        ruleRemoveUnconfirmed.hour = config.schedules.remove_unconfirmed.hour;
        ruleRemoveUnconfirmed.minute = config.schedules.remove_unconfirmed.minute;
        ruleRemoveUnconfirmed.tz = "Europe/Belgrade";

        schedule.scheduleJob(ruleRemoveUnconfirmed, function () {

            client.channels.fetch(config.channel_Confirmations).then(channel => {

                channel.send("Removed unconfirmed teams and teams that did not react at all.").then(msg => {

                    client.commands.get('%removeunconfirmed').execute(msg, config, client, server);

                }).catch(err => console.error("Error happened."));

            });

        });
    }


    const ruleOpenWaitlist = new schedule.RecurrenceRule();



    ruleOpenWaitlist.dayOfWeek = config.schedules.open_waitlist.dayOfWeek;

    ruleOpenWaitlist.hour = config.schedules.open_waitlist.hour;

    ruleOpenWaitlist.minute = config.schedules.open_waitlist.minute;

    ruleOpenWaitlist.tz = "Europe/Belgrade";



    schedule.scheduleJob(ruleOpenWaitlist, function () {

        client.channels.fetch(config.channel_Waitlist).then(channel => {

            if (config.number_of_teams < 20) {

                channel.send("%openwait").then(msg => {

                    msg.delete({ timeout: 500 })

                }).catch(err => console.error("Error happened."));
            } else {

                channel.send("No free slots.").catch(err => console.error("Error happened."));

            }

        });

    });



    const ruleCloseWaitlist = new schedule.RecurrenceRule();



    ruleCloseWaitlist.dayOfWeek = config.schedules.close_waitlist.dayOfWeek;

    ruleCloseWaitlist.hour = config.schedules.close_waitlist.hour;

    ruleCloseWaitlist.minute = config.schedules.close_waitlist.minute;

    ruleCloseWaitlist.tz = "Europe/Belgrade";



    schedule.scheduleJob(ruleCloseWaitlist, function () {

        client.channels.fetch(config.channel_Waitlist).then(channel => {

            channel.send("%lockwait").then(msg => {

                msg.delete({ timeout: 500 })

            }).catch(err => console.error("Error happened."));

        });

    });

}