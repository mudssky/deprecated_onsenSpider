const fs = require('fs')
const axios = require('axios').default
// const fetch = require('node-fetch')
const path = require('path')
// const https = require('https')
// const url = 'https://www.onsen.ag/web_api/programs.json'
const config = {
  url: 'https://www.onsen.ag/web_api/programs.json',
  headers: {
    // // 'Accept-Encoding': 'gzip, deflate',
    // Accept: '*/*',
    // Connection: 'keep-alive',
  },
}

// const programsJsonPath = 'programs.json'

const achieveJson = readAchieve()
async function saveStr(path, jsonstr) {
  fs.writeFileSync(path, jsonstr)
}

// 获取节目表json并保存
// async function getJson() {
//   const response = await axios(config)
//   console.log(response.data)
//   await savejson('programs.json', JSON.stringify(response.data))
// }
function safeFilename(filenamestr) {
  return filenamestr.replace(/[\\\\/:*?\"<>|’]/g, ' ')
}

// 读取记录已下载节目id和图片id的json
function readAchieve() {
  // 如果没有存档文件，说明是第一次下载，返回对象的数组为空
  if (!fs.existsSync('achives.json')) {
    return {
      downloadedIDs: [],
      downloadedImgs: [],
    }
  }
  const achivesStr = fs.readFileSync('achives.json', 'utf8')
  return JSON.parse(achivesStr)
}

// 读取json
async function parsePrograms() {
  const updateList = []
  let resp
  try {
    resp = await axios(config)
    // const response = await fetch(url)
    // const response = await fetch(url, {
    //   'user-agent':
    //     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
    // })
    // process.exit(0)
  } catch (e) {
    console.log(e)
    //   console.log('error')
    process.exit(0)
  }
  // console.log('success')
  console.log(`请求json成功：${JSON.stringify(resp.headers)}`)
  // console.log(response)
  // process.exit(0)
  const programJson = resp.data.filter(function (program) {
    return program.contents.length > 0
  })
  for (let program of programJson) {
    const performersList = []
    program.performers.forEach(function (item) {
      performersList.push(item.name)
    })
    let folderName = `radio/${safeFilename(
      program.title
    )}[${program.performers.join(',')}]`
    downloadContent = program.contents.filter((content) => {
      return content.latest === true && content.streaming_url != null
    })
    if (downloadContent.length === 1) {
      const filename = `${safeFilename(downloadContent[0].title)}${
        downloadContent[0].guests.length > 0
          ? `[guest:${downloadContent[0].guests.join(',')}]`
          : ''
      }`
      // console.log({
      //   performersList,
      //   filename,
      //   folderName,
      //   m3u8:downloadContent[0].streaming_url
      // })
      // 判断若文件存在则不加入更新列表，首先判断id，其次由于播音员改变可能造成文件夹改变，
      if (
        !achieveJson.downloadedIDs.includes(downloadContent[0].id) ||
        !fs.existsSync(folderName)
      ) {
        updateList.push({
          performersList,
          filename,
          folderName,
          m3u8: downloadContent[0].streaming_url,
          cover: program.image.url,
          id: downloadContent[0].id,
        })
      }
    }
  }
  if (updateList.length > 0) {
    console.log('节目表有更新，创建新的programs.json...')
    saveStr('programs.json', JSON.stringify(resp.data))
  }
  return updateList
}
async function main() {
  let downloadScript = ''
  const updateList = await parsePrograms()
  console.log(`需要更新的节目有${updateList.length}个`)
  console.log(updateList)
  if (updateList.length === 0) {
    return
  }

  for (let updateItem of updateList) {
    if (!fs.existsSync(updateItem.folderName)) {
      console.log(`创建新文件夹：${updateItem.folderName}`)
      fs.mkdirSync(updateItem.folderName, { recursive: true })
    }
    for (let updateItem of updateList) {
      const coverName = updateItem.cover.split('=')[1] + '.jpeg'
      if (
        !achieveJson.downloadedImgs.includes(updateItem.cover) &&
        fs.existsSync(updateItem.folderName)
      ) {
        try {
          await axios({
            method: 'get',
            url: updateItem.cover,
            responseType: 'stream',
          }).then(function (response) {
            response.data.pipe(
              fs.createWriteStream(
                path.resolve(updateItem.folderName, coverName)
              )
            )
            console.log(`成功下载新封面： ${updateItem.cover}`)
            achieveJson.downloadedImgs.push(updateItem.cover)
          })
        } catch (err) {
          console.log('下载封面失败', err)
        }
      }
    }

    // }else{
    //   console.log(downloadItem)
    // }
    downloadScript +=
      `N_m3u8DL-CLI_v2.9.6.exe '${updateItem.m3u8}' --saveName '${updateItem.filename}'  --workDir '${updateItem.folderName}' --retryCount 99 --enableDelAfterDone` +
      '\n'
    console.log(`创建下载脚本：${downloadScript}`)
    // 添加新节目的id
    if (!achieveJson.downloadedIDs.includes(updateItem.id)) {
      achieveJson.downloadedIDs.push(updateItem.id)
    }
  }
  console.log('创建down.ps1...')
  saveStr('down.ps1', downloadScript)
  console.log('创建achives.json...')
  saveStr('achives.json', JSON.stringify(achieveJson))
}

main()
