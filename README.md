# bootstrap-css-treeshaking

## What is this?

**bootstrap-css-treeshaking** is a css minifier, currently only used for [bootstrap](https://getbootstrap.com/docs/4.6/getting-started/introduction/).  
Do you have any of the following experiences when using **bootstrap**?

1. The css file is too large
2. Unwanted styles are imported
3. Too many unknown css rules

Use this tool to help you solve the above problems.

## How to use this?

### Prerequisite

You have to install [Nodejs](https://nodejs.org/en).

### Steps

```bash
git clone https://github.com/vivelarepublique/bootstrap-css-treeshaking.git

cd bootstrap-css-treeshaking

npm run test 
```

Then a `min.css` file will be generated in the `\test` directory.

This file is generated based on `\test\template.html`, if you want to use your own html file, please modify the content of `\test\template.html`, or use the this command:`npm run begin {your HTML file location}`.
