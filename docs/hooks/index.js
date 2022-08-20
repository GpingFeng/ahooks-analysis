// 读取目录下所有的文件
const fs = require('fs');

const folder = './effect/';

fs.readdir(`${folder}`, function(err, files) {
  if (err) {
    console.log('Error', err);
  } else {
    console.log('Result', files);
    files.forEach(path => {
      fs.readFile(`${folder}${path}`, 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        const name = path.slice(0, path.length - 3);
        const docName = name.replace(/([A-Z])/g, '-$1').toLowerCase();
        const content = `

- [文档地址](https://ahooks.js.org/zh-CN/hooks/${docName})

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/${name}/index.ts)
`;
        const result = data.replace(/\n/, content);
        fs.writeFile(`${folder}${path}`, result, err => {
          if (err) {
            console.error(err);
            return;
          }
          //文件写入成功。
        });
      });
    });
  }
});

// 最终生成值
// [文档地址](https://ahooks.js.org/zh-CN/hooks/use-mount)
// [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useMount/index.ts)
