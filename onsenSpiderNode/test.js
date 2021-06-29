const axios =require('axios').default
const  fs = require('fs')
// axios({url:'http://www.onsen.ag/web_api/programs.json'}).then(function(res){
//     console.log(res)

// })
// axios.interceptors.request.use(function (config) {
//     console.log('发送请求成功，打印配置')
//     console.log(config)
//     return config;
//   }, function (error) {
//     console.log('失败')
//     return Promise.reject(error);
//   });
//   const instance = axios.create({
//     baseURL: '',
    // timeout: 10000,
    // headers: {'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36'},
    // responseType: 'json'

    // axios.get('https://d3bzklg4lms4gh.cloudfront.net/program_info/image/default/production/cb/e8/beab9536f36c958bed78bdd6a5796d4dc7e3/image?v=1594197014',
    // {
    //   responseType: 'stream'
    // })
    //   .then((response)=>{
    //       response.data.pipe(fs.createWriteStream('test.jpeg'))
    //   })


      axios({
        method: 'get',
        url: 'https://d3bzklg4lms4gh.cloudfront.net/program_info/image/default/production/66/99/05f3c9402ca36cc3156dd50b7ab9aad298dd/image?v=1602579721',
        responseType: 'stream'
      })
        .then(function (response) {
          response.data.pipe(fs.createWriteStream('radio/ada_lovelace.jpg'))
        });