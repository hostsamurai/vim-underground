class Seed < Thor
  require 'rest_client'
  require 'json'

  attr_accessor :db

  def initialize(*)
    super
    @db = JSON.parse( File.read '.couchapprc' )['env']['default']['db']
  end

  desc 'all', 'seed database with articles, screencasts, and scripts'
  def all
    articles && screencasts && scripts
  end

  desc 'articles', 'seed database with articles'
  def articles
    post('articles')
  end

  desc 'screencasts', 'seed database with screencasts'
  def screencasts
    post('screencasts')
  end

  desc 'scripts', 'seed database with scripts'
  def scripts
    post('scripts')
  end

  desc 'docify', 'converts vim scripts json data into a format acceptable to couchdb. See README for more info.'
  method_option "--push", 
                :type => :boolean,
                :aliases => "-p",
                :banner => "Push docs to couchdb after docifying"
  def docify(file = 'data/vim-scripts.json')
    puts "Docifying..."
    system "sed -r -f data/scripts_to_doc.sed -i #{file}"
    puts "DONE!"
    post File.basename(file, File.extname(file)) if options['push'] || options['p']
  end

  private

    def post(type)
      docs = File.read "./data/#{type}.json"
      puts "Pushing #{type}" 
      RestClient.post "#{@db}/_bulk_docs", docs, :content_type => :json, :accept => :json
    end
end
