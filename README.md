# Unhack for Jekyll

The Goal is to create a GUI for the static site generator jekyll as an Electron App

This is my Bachelor's Thesis Project, **still in Development**

# Installation
## jekyll
unHack requires you to have jekyll installed.
Please follow the [jekyll Installation Guide](https://jekyllrb.com/docs/installation/) if you don't know how to achieve that.

### Caution for Windows Users
if you are using a jekyll installation within the Linux Subsystem of Windows, unHack will not be able to process. Make sure you install jekyll on the regular Windows system.

## Git
In order for unHack to publish to GitHub, you need to have Git installed.

## unHack
### Windows
Use the .exe file.


# How to make jekyll site compatible with unHack
in order for the App to recognize a jekyll site via the Open Command, you need to create a file called `unhack.json` in the root of the directory.
Minimal Requirements for content are

```json
{
  "name": "YOUR SITES NAME HERE"
}
```

# Config File
The `unhack.json` file is key for every unHack project. Within this File Information for Publication will be stored, as well as Configuration for the Theme Front Matter.

## Name
Every projects does minimally need a name

```json
{
  "name": "YOUR SITES NAME HERE",
}
```

## Publication Settings
These settings are automatically created if they aren't already in the file. But if you want to set them up via JSON this is how it's done.
`method` is the currently active method, so either enter `ftp` or `gitHub`.

```json
{
  "publicationSettings": {
    "ftp": {
      "ftpHost": "",
      "ftpUsername": "",
      "ftpPort": "",
      "ftpDirectory": ""
    },
    "gitHub": {
      "gitHubUsername": "",
      "gitHubUserEmail": "",
      "gitHubRepoName": ""
    },
    "method": ""
  }
}
```

## Navigation Builder
In order to support the custom Menu Builder, the config file needs to contain.
How the Navigation Builder works and how to properly integrate it into your theme is covered in the Theme Compatibility section.

```json
{
  "menuSupport": "true"
}
```

# Theme Compatibility
unHack offers a couple customizing Options within it's Configuration file. To make your Theme compatible with unHack out of the box, make sure to add a `unhack.json` file.
