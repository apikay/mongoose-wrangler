describe "MongooseWrangler", ->
  MongooseWrangler = require '../'

  it "should setup mongoose-datatable based on option: datatable", ->
    spyOn MongooseWrangler.prototype, 'connect'
    spyOn MongooseWrangler.prototype, 'useDataTable'
    mw = new MongooseWrangler
      datatable: true
    expect(MongooseWrangler.prototype.connect).toHaveBeenCalled()
    expect(MongooseWrangler.prototype.useDataTable).toHaveBeenCalled()
