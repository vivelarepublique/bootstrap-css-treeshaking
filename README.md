# bootstrap-css-shaking

## What is this?

**bootstrap-css-shaking** is a css minifier, currently only used for [bootstrap](https://getbootstrap.com/docs/4.6/getting-started/introduction/).  
Do you have any of the following experiences when using **bootstrap**?

1. The css file is too large
2. Unwanted styles are imported
3. Too many unknown css rules

Use this tool to help you solve the above problems.

## How to use this?

### Prerequisite

You have to install [Nodejs](https://nodejs.org/en) first.

### Steps

```bash
git clone https://github.com/vivelarepublique/bootstrap-css-treeshaking.git

node .\index.js {your html file path}
```

Then a **min.css** file will be generated in the **\test** directory.

Replace the original **bootstrap.css** with this new css file.
