**WhiteSource npm module**
  
    __          ___     _ _        _____                          _ 
    \ \        / / |   (_) |      / ____|                        | |
     \ \  /\  / /| |__  _| |_ ___| (___   ___  _   _ _ __ ___ ___| |
      \ \/  \/ / | '_ \| | __/ _ \\___ \ / _ \| | | | '__/ __/ _ \ |
       \  /\  /  | | | | | ||  __/____) | (_) | |_| | | | (_|  __/_|
        \/  \/   |_| |_|_|\__\___|_____/ \___/ \__,_|_|  \___\___(_)
                                                                 
                                                                 


Install using `npm install whitesource`

## Example use

### whitesource config
Configurations keys:

- Username

- Password

- Whitesource Token

- Enable black list (default : false)

- Change Traversing depth

- Quit build on failure (default: false)

to configure your whitesource plugin using the CLI
```bash
$ whitesource config
```

 *Configurations are saved in the projects "whitesource.config.json" file (auto-generated)*


### to run whitesource after initial configuration 

Locate the project you want to build and run whitesource from the project root.
make sure there is a **package.json** file in the project root before running whitesource

```bash
$ whitesource run
```

WhiteSource dependencies report is saved in the projects "whitesource.report.json" file (auto-generated)


### NOTES ###

Node ShrinkWrapper JSON

Grunt / Gulp

FrondEnd JS using Require.js / AMD

Command line interface

Posting Report
