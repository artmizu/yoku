require "erb"

class Overview
  attr_reader :html

  def initialize
    @template = File.read('./overview/index.erb')
    @data = GetData.new(Dir["./*.html"]).generate
  end

  def render
    ERB.new(@template, 0, "", "@html").result( binding )
    index_file = File.new("index.html", "w+")
    index_file.puts(@html)
  end
end

class GetData
  def initialize(arr)
    @raw = arr
    @data = []
  end

  def generate
    @raw.each do |item|
      @data.push(get_data_from_item(item))
    end

    return @data
  end

  def get_data_from_item(item)
    obj = {}
    obj[:name] = get_item_name(item)
    obj[:url] = item
    return obj
  end

  def get_item_name(item)
    regexp = /\.\/(.+)/.match(item)
    return regexp[1]
  end
end

Overview.new.render