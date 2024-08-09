# pebble-rat-scrim-bot

@Rat's Scrim Bot#2823 - Instructions:

`%early` - opens registrations for VIP
`%open` - opens registrations for everyone
`%lock` - locks registrations for everyone

Format:
`%register`
`Team name`
`Team tag`
`@ manager`

`%confirm` - sends confirmation message 

`%slots` - refreshes slot list
`%clear all` - cancels all teams / clears slot list and removes roles
`%clear 3` - cancels team with slot 3 
`%yes 3` - confirms team with slot 3 / underlines that team

`%openwait` - opens waitlist
`%lockwait` - closes waitlist

`%del` - deletes 100 msgs in channel (skips pinned msgs)

`%registerVIP` - this is for slot 23 or VIP. Please use it carefully. 

`%test` - test if bot is online

__**NOTE:**__ Bot automatically does the following:
> x:00 - %early
> x:00 - %open
> x:15 - %confirm
> x:25 - %lock
> x:30 - %openwait
> x:00 - %closewait

__**TODO:**__
- Enable commands or smth so staff can change settings (texts and messages and roles etc...)
