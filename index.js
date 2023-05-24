const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const { argv } = require('process');
const { createInterface } = require('readline');

const css = readFileSync('bootstrap.css', { encoding: 'utf-8' });

const paragraph = (css.includes('\r\n') ? css.split(/(?<=\r\n\})\r\n(?=\r\n)/gm) : css.split(/(?<=\n\})\n(?=\n)/gm)).map(el => el.trim());
const cssContent = paragraph.map(el => {
    const index = el.indexOf('{');
    return {
        selector: el
            .substring(0, index)
            .split(',')
            .map(items => items.trim()),
        content: el.substring(index),
        overall: el,
    };
});

const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
});

globalStyle();

function mediaQueries(globalStyle) {
    rl.question('Do you need to load the styles of \x1b[35mMedia Queries\x1b[0m ? (\x1b[32myes\x1b[0m/\x1b[31mno\x1b[0m, default is \x1b[32myes\x1b[0m): ', input => {
        input = input.trim().toLowerCase();
        console.log(input ? input : 'yes');

        if (input === 'yes' || !input) {
            writeCssFile(globalStyle, true, argv?.[2]);
            rl.close();
        } else if (input === 'no') {
            writeCssFile(globalStyle, false, argv?.[2]);
            rl.close();
        } else {
            console.log('unrecognized input!');
            mediaQueries();
        }
    });
}

function globalStyle() {
    rl.question('Do you need to load the styles of \x1b[34mhtml\x1b[0m and \x1b[33mbody\x1b[0m? (\x1b[32myes\x1b[0m/\x1b[31mno\x1b[0m, default is \x1b[32myes\x1b[0m): ', input => {
        input = input.trim().toLowerCase();
        console.log(input ? input : 'yes');

        if (input === 'yes' || !input) {
            mediaQueries(true);
        } else if (input === 'no') {
            mediaQueries(false);
        } else {
            console.log('unrecognized input!');
            globalStyle();
        }
    });
}

function writeCssFile(globalStyle, mediaQueries, fileArgument) {
    const specialElements = ['html', 'body'];

    if (fileArgument) {
        const html = readFileSync(argv[2], { encoding: 'utf-8' });
        const body = html.match(/(?<=<body>)([\s\S]*)(?=<\/body>)/i)?.[0];

        //specialElements
        const specialElementsResult = [];
        if (globalStyle) {
            specialElements.forEach(el => specialElementsResult.push(cssContent.find(({ selector }) => selector?.[0].trim() === el).overall));
            specialElementsResult.push(`*,\n*::before,\n*::after {\n\tbox-sizing: border-box;\n}`);
        }

        //elements
        const elements = body.match(/(?<=<)\w+(?=\s|(?=>))/g);
        const elementArray = Array.from(new Set(elements));

        const step1Result = [];

        elementArray.forEach(el => {
            cssContent.forEach(({ selector, overall }) => {
                if (selector.includes(el) && !selector.includes('.') && !selector.includes('type')) step1Result.push(overall);
                selector.forEach(item => {
                    if (item.includes(':') && item.substring(0, item.indexOf(':')) === el) step1Result.push(overall);
                });
            });
        });

        //class names
        const classNames = body.match(/(?<=class=")[a-zA-Z0-9\-\s]+?(?=")/g);
        const classNameArray = Array.from(new Set(Array.from(classNames).reduce((acc, cur) => acc.concat(cur.split(' ')), [])));

        const step2Result = [];

        classNameArray.forEach(el => {
            cssContent.forEach(({ selector, overall }) => {
                if (selector.includes(`.${el}`)) step2Result.push(overall);
                selector.forEach(item => {
                    if (item.includes(':') && item.substring(1, item.indexOf(':')) === el) step1Result.push(overall);
                });
            });
        });

        //types
        const types = body.match(/(?<=type=").+?(?=")/g);
        const typesArray = Array.from(new Set(types));

        const step3Result = [];

        typesArray.forEach(el => {
            const elString = `input[type=\"${el}\"]`;
            cssContent.forEach(({ selector, overall }) => {
                if (selector.includes(elString)) step3Result.push(overall);
            });
        });

        //mediaQueries
        const mediaQueriesResult = [];
        if (mediaQueries) {
            const mediaQueries = cssContent.filter(({ selector }) => selector?.[0].includes('@media'));
            mediaQueries.forEach(({ selector, content }) => {
                const classRules = (content.includes('\r\n') ? content.substring(1, content.length - 1).split(/(?<=\})\r\n(?=\r\n)/gm) : content.substring(1, content.length - 1).split(/(?<=\})\n(?=\n)/gm)).map(el => el.trim());
                const subRule = [];
                classRules.forEach(el => {
                    const index = el.indexOf('{');
                    const subSelector = [];
                    el.substring(0, index)
                        .split(',')
                        .map(item => item.trim())
                        .forEach(item => {
                            if (item.includes(':')) {
                                const colonIndex = item.indexOf(':');
                                if (classNameArray.includes(item.substring(1, colonIndex))) subSelector.push(item);
                            }
                            if (item.includes('>')) {
                                const bigIndex = item.indexOf('>');
                                if (classNameArray.includes(item.substring(1, bigIndex)) || classNameArray.includes(item.substring(bigIndex + 1))) subSelector.push(item);
                                if (item.includes('+')) {
                                    const plusSub = item.substring(bigIndex);
                                    const plusIndex = plusSub.indexOf('+');
                                    if (classNameArray.includes(plusSub.substring(2, plusIndex)) || classNameArray.includes(plusSub.substring(plusIndex + 2))) subSelector.push(item);
                                }
                            }
                            if (item.includes(' ')) {
                                const spaceIndex = item.indexOf(' ');
                                if (classNameArray.includes(item.substring(1, spaceIndex)) || classNameArray.includes(item.substring(spaceIndex + 1))) subSelector.push(item);
                            }
                            if (classNameArray.includes(item.substring(1))) subSelector.push(item);
                        });
                    if (subSelector.length) {
                        const result = subSelector.reduce((acc, cur) => acc + ',\n\t' + cur) + ' ' + el.substring(index);
                        subRule.push(result);
                    }
                });
                if (subRule.length) {
                    const result = selector + ' {\n\t' + subRule.reduce((acc, cur) => acc + '\n\n\t' + cur) + '\n}\n';
                    mediaQueriesResult.push(result);
                }
            });
        }

        //console.log(elementArray, '\n', classNameArray, '\n', typesArray);

        const minCss = Array.from(new Set([...specialElementsResult, ...step1Result, ...step2Result, ...step3Result, ...mediaQueriesResult]))
            .reduce((acc, cur) => acc + '\n\n' + cur, '')
            .trim();

        writeFileSync(join('test/', 'min.css'), minCss);
    } else {
        console.log('The template html file was not found, please make sure that the command you executed contains an html file. \nSuch as: node .\\index.js test/index.html');
    }
}
