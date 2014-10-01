**WhiteSource npm module**

Install using `npm install whitesource`

## Example use

### whitesource config
Configurations include:

**Username**
**Password**
**Whitesource Token **
**Enable black list (default : false) **
**Change Traversing depth **
**Quit build on failure (default: false) **

to configure your whitesource plugin using the CLI
```bash
$ whitesource config
```
*Configurations are saved in the projects "whitesource.config.json" file (auto-generated)


### to run whitesource after initial configuration 
```bash
$ whitesource run
```

*WhiteSource dependencies report is saved in the projects "whitesource.report.json" file (auto-generated)


### NOTES ###
**Grunt / Gulp **
**Global Command line interface **
** 
**Front End plugins using require.js / amd **
