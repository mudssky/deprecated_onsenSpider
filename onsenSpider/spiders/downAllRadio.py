# -*- coding: utf-8 -*-
import scrapy
import os
import re
from onsenSpider.items import ProgramItem,FileItem
from scrapy.selector import Selector

class DownallradioSpider(scrapy.Spider):
    name = 'downAllRadio'
    allowed_domains = ['www.onsen.ag']
    start_urls = ['http://www.onsen.ag/']

    '''
    请求xml接口，获得所有节目的相关信息
    '''
    def start_requests(self):
        if os.path.exists('down.ps1'):
            os.remove('down.ps1')
        yield scrapy.Request(url='http://www.onsen.ag/app/programs.xml',callback=self.parse_programXML)


    def get_programsXML(self):
        if not os.path.exists('programs.xml'):
            return None
        else:
            with open('programs.xml','r',encoding='utf8')as f:
                xml=f.read()
            f.close()
            return xml
    def save_programsXML(self,xml):
        with open('programs.xml', 'w', encoding='utf8')as f:
            f.write(xml)
        f.close()
        self.logger.info('save programs xml succeed')

    def convert_windowsFileName(self,filename):
        return  re.sub(r'[\/:*?"<>|]', " ",filename)

    def parse_programXML(self,response):
        radio_root = 'radio'
        # if not os.path.exists(radio_root):
        #     os.mkdir(radio_root)
        old_xml = self.get_programsXML()
        # 如果不存在xml文件，那么我们直接下载一次所有节目,把所有节目的需要下载属性设置为True
        # 更新列表，把要更新的项目添加进去，用于计数
        # print(old_xml)
        update_list=[]
        powershellStr=''
        for program in response.xpath('//program'):
            item=ProgramItem()
            item['id']=program.xpath('@id').get()
            item['title'] = program.xpath('./title/text()').get()
            item['banner_image'] = program.xpath('./banner_image/text()').get()
            item['program_number'] = program.xpath('./program_number/text()').get()
            item['up_date'] = program.xpath('./up_date/text()').get()
            item['personalities'] = program.xpath('./personalities/personality/name/text()').getall()
            item['iphone_url'] = program.xpath('./iphone_url/text()').get()
            item['movie_url'] = program.xpath('./movie_url/text()').get()
            item['actor_tag']=program.xpath('./actor_tag/text()').get()
            item['android_url'] = program.xpath('./android_url/text()').get()

            if old_xml is None:
                item['need_download']=True
            else:
                # 如果存在xml文件，需要将新请求到的xml与原来的进行对比，如果节目号码不一样进行更新
                # self.logger.info('program:'+str(item))
                sel=Selector(text=old_xml)
                old_program=sel.xpath('//program[@id="'+item['id']+'"]')
                old_program_number=old_program.xpath('./program_number/text()').get()
                if old_program_number!=item['program_number']:
                    item['need_download']=True
                    update_list.append(item)
                else:
                    item['need_download']=False
            # 检查有没有能下载的音频链接

            # 输出更新的节目数
            can_download=[]
            if item['android_url'] is not None:
                can_download.append(item['android_url'])
            if item['iphone_url'] is not None:
                can_download.append(item['iphone_url'])
            if item['movie_url'] is not None:
                can_download.append(item['movie_url'])
            if len(can_download)==0:
                item['need_download']=False
            if item['need_download']:
                if item['actor_tag'] is not None:
                    actor_list = item['actor_tag'].split(',')
                else:
                    actor_list=[]
                guest = []
                for person in item['personalities']:
                    if person not in actor_list:
                        guest.append(person)
                if len(guest)==0:
                    guest_str=''
                else:
                    guest_str ='['+ ','.join(guest)+']'
                if item['up_date'] is None:
                    date='none'
                else:
                    date = item['up_date'].split(' ')[0]
                audio_dir = '{title}[{actor_tag}]'.format(title=item['title'], actor_tag=item['actor_tag'])
                audio_dir = os.path.join(radio_root, self.convert_windowsFileName(audio_dir))
                audio_ext = can_download[0][-3:]
                # audio_name = '{program_number} {title}[{date}][{guest_str}].{audio_ext}'.format(
                #     program_number=item['program_number'], title=item['title'], date=date, guest_str=guest_str,
                #     audio_ext=audio_ext)
                audio_name = '{program_number}[{date}]{guest_str}.{audio_ext}'.format(
                    program_number=item['program_number'], date=date, guest_str=guest_str,
                    audio_ext=audio_ext)
                audio_name = self.convert_windowsFileName(audio_name)
                # if not os.path.exists(audio_dir):
                #     os.mkdir(audio_dir)
                audio_path = os.path.join(audio_dir, audio_name)
                item['audio_path'] = audio_path
                item['audio_dir']=audio_dir
                # self.logger.info(str(can_download))
                item1=FileItem()
                # yield scrapy.Request(url=can_download[0],callback=self.save_audio,meta={'item':item})
                item1['file_urls']=[can_download[0]]
                item1['file_path']=item['audio_path']

                powershellStr+= "http --download   '{file_url}' --output '{path}'\n".format(file_url=item1['file_urls'][0],path=item1['file_path'].replace('\\','/') )
                yield item1

                imgurlSplited=item['banner_image'].split('/')
                if len(imgurlSplited)!=0:
                    img_name=imgurlSplited[-1]
                    img_name=self.convert_windowsFileName(img_name)
                    img_url=r'http://www.onsen.ag'+item['banner_image']
                    item['img_name']=img_name
                    # imgpath = os.path.join(item['audio_dir'], img_name)
                    imgpath = os.path.join(item['audio_dir'], img_name)
                    # 如果同名图片文件已经存在就不不必下载了
                    if not os.path.exists(imgpath):
                        item2=FileItem()
                        item2['file_urls'] = [img_url]
                        item2['file_path'] = imgpath
                        yield item2
                    # yield scrapy.Request(url=img_url,callback=self.save_img,meta={'item':item})
                # 需要下载的部分的信息才需要保存，所以这个yield在判断需要下载的if里面
                yield item
        # powershell运行utf8编码的文本会乱码
        with open('down.ps1','w',encoding='utf16') as f:
            f.write(powershellStr)
        f.close()

        # 统计发生更新的节目
        print('*' * 100)
        self.logger.info('update {num} program'.format(num=len(update_list)))
        for tmp in update_list:
            self.logger.debug(str(tmp['program_number'])+'  '+str(tmp['title']))
        if len(update_list)!=0:
            self.save_programsXML(response.text)
        print('*' * 100)
        # with open('program.xml','w',encoding='utf8')as f:
        #     f.write(response.text)
        # f.close()
    # def save_audio(self,response):
    #     self.logger.info('hello')
    #     item=response.meta['item']
    #     path=item['audio_path']
    #     audio=response.body
    #     self.save_file(audio,path)
    #     self.logger.info('save audio complted:'+path)
    #     yield None
    # def save_img(self,response):
    #     item = response.meta['item']
    #     path = os.path.join(item['audio_dir'],item['img_name'])
    #     img = response.body
    #     self.save_file(img, path)
    #     self.logger.info('save img complted:'+path)
    #     yield None
    # def save_file(self,file,path):
    #     with open(path,'wb')as f:
    #         f.write(file)
    #     f.close()