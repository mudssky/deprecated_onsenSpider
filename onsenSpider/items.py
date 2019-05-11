# -*- coding: utf-8 -*-

# Define here the models for your scraped items
#
# See documentation in:
# https://doc.scrapy.org/en/latest/topics/items.html

import scrapy


class ProgramItem(scrapy.Item):
    # define the fields for your item here like:
    # name = scrapy.Field()
    id = scrapy.Field()
    title=scrapy.Field()
    banner_image=scrapy.Field()
    program_number=scrapy.Field()
    up_date=scrapy.Field()
    personalities=scrapy.Field()
    iphone_url=scrapy.Field()
    movie_url=scrapy.Field()
    android_url=scrapy.Field()
    need_download=scrapy.Field()
    image_can_download=scrapy.Field()
    actor_tag=scrapy.Field()
    audio_path=scrapy.Field()
    audio_dir=scrapy.Field()
    img_name=scrapy.Field()
class FileItem(scrapy.Item):
    file_urls=scrapy.Field()
    files=scrapy.Field()
    file_path=scrapy.Field()