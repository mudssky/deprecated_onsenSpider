# -*- coding: utf-8 -*-

# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://doc.scrapy.org/en/latest/topics/item-pipeline.html
import scrapy
import pymongo
from scrapy.pipelines.files import FilesPipeline
from onsenSpider.items import FileItem
class OnsenspiderPipeline(object):
    def process_item(self, item, spider):
        return item

class FileDownloadPipeline(FilesPipeline):
    def get_media_requests(self, item, info):
        # print('*'*20+'show info'*5,str(info))
        # print('item',str(item))
        if  isinstance(item,FileItem):
            for file_url in item['file_urls']:
                yield scrapy.Request(url=file_url,meta={'item':item})
        # yield scrapy.Request(url=item['file_url'],meta={'item':item})

    def file_path(self, request, response=None, info=None):
        # print('='*20+str(request.meta['item']))
        item=request.meta['item']
        path=item['file_path']
        return path


class InnsertMongodbPipeline(object):
    collection_name='radioupdate'
    def __init__(self, mongo_uri, mongo_db):
        self.mongo_uri = mongo_uri
        self.mongo_db = mongo_db

    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            mongo_uri=crawler.settings.get('MONGO_URI'),
            mongo_db=crawler.settings.get('MONGO_DATABASE')
        )
    def open_spider(self, spider):
        self.client = pymongo.MongoClient(self.mongo_uri)
        self.db = self.client[self.mongo_db]
    def process_item(self, item, spider):
        insert_result=self.db[self.collection_name].insert_one(dict(item))
        spider.logger.info('insert completed'+str(insert_result))
        return item
    def close_spider(self, spider):
        self.client.close()
