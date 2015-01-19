**WhiteSource npm module**
  
    __          ___     _ _        _____                          _ 
    \ \        / / |   (_) |      / ____|                        | |
     \ \  /\  / /| |__  _| |_ ___| (___   ___  _   _ _ __ ___ ___| |
      \ \/  \/ / | '_ \| | __/ _ \\___ \ / _ \| | | | '__/ __/ _ \ |
       \  /\  /  | | | | | ||  __/____) | (_) | |_| | | | (_|  __/_|
        \/  \/   |_| |_|_|\__\___|_____/ \___/ \__,_|_|  \___\___(_)
                                                                 
                                                                 




More about the White Source service : [http://www.whitesourcesoftware.com/](http://www.whitesourcesoftware.com/)

## Getting Started:

### 1) Install WhiteSource **globally**.
```bash
$ npm install -g whitesource
```

### Ubuntu - Install WhiteSource **globally**.
If you experience trouble with running whitesource globally on Ubuntu:
After installing locate the whitesource package by running:
```bash
$ which whitesource
```

and then create an alias to run whitesource globally:
```bash
$ alias whitesource="node path/to/whitesource"
```

### Having trouble finding "node" in Ubuntu?
The node package can be found in several packages in Ubuntu: `node` and `nodejs`.
Locate the node package by running:
```bash
$ which node
```

if displayed `/usr/sbin/node` remove it:
```bash
$ sudo rm /usr/sbin/node
```

then make a link:
```bash
$ sudo ln -s /usr/bin/nodejs /usr/bin/node
```

### 2) Initial configuration
Create a "whitesource.config.json" file in your project root directory and input your WhiteSource Token:

```bash
	{"apiKey":"EXAMPLE TOKEN"}
```

### 3) Run whitesource

Locate the project you want to build and run whitesource from the project root.
make sure you have both a **package.json** file and the **whitesource.config.json** file you created in located at project root before running whitesource run command:

```bash
$ whitesource run
```

WhiteSource dependencies report is saved in the projects "whitesource.report.json" file (auto-generated)
and posted to your WhiteSource Dashboard.


### Example WhiteSource report ###
![alt tag](http://www.whitesourcesoftware.com/wp/wp-content/uploads/2014/05/slider2_032.png)



### NOTES ###

Node ShrinkWrapper JSON

Grunt / Gulp

FrondEnd JS using Require.js / AMD

Command line interface

Posting Report
