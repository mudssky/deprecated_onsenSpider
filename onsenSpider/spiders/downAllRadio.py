# -*- coding: utf-8 -*-
import scrapy


class DownallradioSpider(scrapy.Spider):
    name = 'downAllRadio'
    allowed_domains = ['www.onsen.ag']
    start_urls = ['http://www.onsen.ag/']

    def parse(self, response):
        pass
