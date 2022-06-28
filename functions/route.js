const monumentos = require('./monumentos.json')

metersTo = (lat1,lon1,lat2,lon2)=> {
    rad = function(x) {return x*Math.PI/180;}
    var R = 6378.137; //Radio de la tierra en km
    var dLat = rad( lat2 - lat1 );
    var dLong = rad( lon2 - lon1 );
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLong/2) * Math.sin(dLong/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d.toFixed(3); //Retorna tres decimales
 }

 getRoutes = ()=>{
    let routes = []
    monumentos.children.forEach(element => {
        let item = {
            id: element.attributes.id
        }
        let basicData = element.children.find( i=> i.name=="basicData" )
        if( basicData){
            item.name = basicData.children.find( i=> i.name=="name" ).value
            item.title = basicData.children.find( i=> i.name=="title" ).value
            item.body = basicData.children.find( i=> i.name=="body" ).value
            item.web = basicData.children.find( i=> i.name=="web" ).value

            let geoData = element.children.find( i=> i.name=="geoData" )
            if( geoData ){
                item.direccion = geoData.children.find( i=> i.name=="address" ).value
                item.latitude = parseFloat(geoData.children.find( i=> i.name=="latitude" ).value)
                item.longitude = parseFloat(geoData.children.find( i=> i.name=="longitude" ).value)

                item.images=[]
                let multimedia = element.children.find( i=> i.name=="multimedia" )
                if( multimedia && multimedia.children ){
                    multimedia.children.forEach( children =>{
                        let url = children.children.find( i=> i.name=="url" ).value
                        if( url ){
                            item.images.push(url)
                        }
                    })
                }
                                
                routes.push(item)
            }
        }        
    });
    return routes
 }

 generateRoute = (lat,log)=>{
    const routes = getRoutes()
    let ret = routes.sort( (a,b)=> 
        metersTo(lat, log, a.latitude, a.longitude)-metersTo(lat, log, b.latitude, b.longitude))
    return ret.slice(0,10)
 }

randomRoute = ()=>{    
    const routes = getRoutes()

    let shuffled = routes
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)

    
    let first = shuffled[Math.floor(Math.random()*shuffled.length)]

    shuffled = shuffled.sort( (a,b)=> 
            metersTo(first.latitude, first.longitude, a.latitude, a.longitude)-metersTo(first.latitude, first.longitude, b.latitude, b.longitude))
    
    return shuffled.slice(0,10)
}

exports.handler = async function(event, context) {
    const lat = event.queryStringParameters.latitude;
    const log = event.queryStringParameters.longitude;
    console.log(`pidiendo ruta ${lat}/${log}`)
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/json',
        },
        body: JSON.stringify( lat && log ? generateRoute(lat,log) : randomRoute())
      };

}
