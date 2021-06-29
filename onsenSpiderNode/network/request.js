module.exports = {
    request: function(config){
        const request =axios.create();
        return request(config)
    }
}