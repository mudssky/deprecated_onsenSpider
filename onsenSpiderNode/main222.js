const fs = require('fs')
const axios = require('axios').default
const path = require('path')
// const http = require('http')
// const https = require('https')
// const config = {
//   url:'http://www.onsen.ag/web_api/programs.json',
//   method: 'get', 
//   headers: {
//     'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36',
//     'X-Requested-With': 'XMLHttpRequest',
//     // 'cookie':'cookie: __utma=243057372.515005825.1576591500.1576594152.1576599687.3'
//   },
//   responseType:'json',
//   // maxRedirects:0,
//   maxRedirects:5,
//   // maxContentLength: 200000000000,
//   // maxBodyLength: 200000000000000,
//   validateStatus: function (status) {
//     return status >= 200 && status < 300; // default
//   },
//   httpAgent: new http.Agent({ keepAlive: true }),
//   httpsAgent: new https.Agent({ keepAlive: true }),
//   proxy:{
//     host:'127.0.0.1',
//     port:7890
//   }
// }
const config = {
  url:'http://www.onsen.ag/web_api/programs.json'
}

const programsJsonPath = 'programs.json'
// function savejson(path,jsonstr){
//   return new Promise((resolve,reject)=>{
//     fs.writeFile(path, jsonstr,(err)=>{
//       if (err){
//         reject(err)
//       }else{
//         resolve()
//       }
//   })
//   })
// }

async function saveStr(path,jsonstr){
     fs.writeFileSync(path, jsonstr)
}
// axios.get('http://www.onsen.ag/web_api/programs.json')
//       .then((response)=>{
//         console.log(response)
//       })

// 获取节目表json并保存
async function getJson(){
  const response = await axios(config)
  console.log(response.data)
   await savejson('programs.json',JSON.stringify(response.data)) 
}
function safeFilename(filenamestr){
  return filenamestr.replace(/[\\\\/:*?\"<>|]/g,' ')
}

// 读取json
async function  parsePrograms(path){
   const  downloadList =[]
   const data = await  fs.readFileSync(path,'utf-8')
   const programJson=JSON.parse(data).filter(function(program){
    return program.contents.length>0
   })
  //  console.log('清理前节目数量'+programJson.length)
  //  const cleanProgramJson = programJson.filter((program)=>{
  //       return program.contents
  //  })
  //  console.log('清理hou节目数量'+cleanProgramJson.length)
   for(let  program of  programJson){
     const performersList = []
      program.performers.forEach(function(item){
          performersList.push(item.name)
      })
      const folderName = `radio/${program.title.replace(/[\\\\/:*?\"<>|]/g,' ')}[${performersList.join(',')}]`
      downloadContent = program.contents.filter((content)=>{
        return content.latest===true&&content.streaming_url!=null
      })
      if (downloadContent.length===1){
          ''.replace
        const  filename = `${program.title} ${downloadContent[0].title.replace(/[\\\\/:*?\"<>|]/g,' ')}${downloadContent[0].guests.length>0?`[guest:${downloadContent[0].guests.join(',')}]`:''}`
        // console.log({
        //   performersList,
        //   filename,
        //   folderName,
        //   m3u8:downloadContent[0].streaming_url
        // })
        downloadList.push({
          performersList,
          filename,
          folderName,
          m3u8:downloadContent[0].streaming_url,
          cover :program.image.url,
          id: downloadContent[0].id
        })

      }
   }
   return downloadList
}

async function makeDownload(){
  let downloadScript = ''
  const downloadList = await parsePrograms(programsJsonPath)
  const downloadedIDs = []
  const downloadedImgs = []
  // console.log(downloadList.length )
  for(let  downloadItem of downloadList){
    downloadedIDs.push(downloadItem.id)
    const coverName = downloadItem.cover.split('=')[1]+'.jpeg'

    await axios({
      method: 'get',
      url:downloadItem.cover,
      responseType: 'stream'
    })
      .then(function (response) {
        response.data.pipe(fs.createWriteStream(path.resolve(downloadItem.folderName,coverName)))
      });
    downloadedImgs.push(downloadItem.cover)
    console.log(`下载图片： ${downloadItem.cover}`)
    const filepath = downloadItem.folderName
    if (! fs.existsSync(filepath)){
      console.log(`创建新文件夹：${filepath}`)
       fs.mkdirSync(filepath,{ recursive: true })
    }
    // }else{
    //   console.log(downloadItem)
    // }
    downloadScript+=`N_m3u8DL-CLI_v2.7.4.exe '${downloadItem.m3u8}' --saveName '${downloadItem.filename}'  --workDir '${filepath}' --retryCount 99 --enableDelAfterDone`+'\n'
  }
  saveStr('down.ps1',downloadScript)

  saveStr( 'achives.json' ,JSON.stringify ({downloadedIDs,downloadedImgs}))
}


// parsePrograms(programsJsonPath)

makeDownload()