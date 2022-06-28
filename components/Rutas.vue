<!-- Please remove this file from your project -->
<template>
  <b-container fluid id="map">
    <l-map :zoom="zoom" :center="center" ref="myMap" @ready="doSomethingOnReady()" >          
        <l-tile-layer url="http://{s}.tile.osm.org/{z}/{x}/{y}.png" :attribution="attribution"></l-tile-layer>
        <l-geo-json :geojson="geojson" :options="options"></l-geo-json>
         <l-control class="nav-custom-control" position="bottomright">
            <b-button-toolbar key-nav aria-label="Toolbar with button groups">
              <b-button-group class="mx-1">
                <b-button @click.stop="gotoNext" :disabled="!showNext">&laquo;</b-button>
              </b-button-group>
              <b-button-group class="mx-1" >
                <b-button @click.stop="changeMap" >Random</b-button>
                <b-button @click.stop="changeMapToLocation" >Location</b-button>
              </b-button-group>
              <b-button-group class="mx-1">
                <b-button @click.stop="gotoPrev" :disabled="!showPrev">&raquo;</b-button>
              </b-button-group>
            </b-button-toolbar>              
          </l-control>
    </l-map>

    <div id="sidebar" class="leaflet-sidebar collapsed">

        <!-- nav tabs -->
        <div class="leaflet-sidebar-tabs">
            <!-- top aligned tabs -->
            <ul role="tablist">
                <li><a href="#details" role="tab"> >> </a></li>                
            </ul>
        </div>

        <!-- panel content -->
        <div class="leaflet-sidebar-content">
            <div class="leaflet-sidebar-pane" id="details">
                <h1 class="leaflet-sidebar-header">
                    {{currentTitle}}
                    <span class="leaflet-sidebar-close"><i class="fa fa-caret-left"></i></span>
                </h1>

                <b-card                    
                    :img-src="currentImage"
                    img-alt="Image"
                    img-top
                    style="max-width: 20rem;"
                    class="mb-2"
                  >
                    <b-card-text>
                      {{currentBody}}
                    </b-card-text>

                    <b-button :href="currentWeb" target="_blacnk" variant="primary">Info</b-button>
                  </b-card>                                
            </div>
        </div>
    </div>

  </b-container>
</template>

<script>
import L from 'leaflet';
import {LMap, LTileLayer, LControl } from 'vue2-leaflet';
import "leaflet-sidebar-v2";

export default {
  name: 'Rutas',
  components: {
    LMap,
    LTileLayer,
    LControl
  },
  data(){
    return{            
      attribution:'&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors and DecideMadrid',
      geojson: null,
      zoom: 14,
      center: [40.41879,-3.6866426],
      currentItem:{},
      currentTitle:"",
      currentBody:"",
      currentImage:"",
      currentWeb:"",
      showNext:false,
      showPrev:false,
      current:0,
      dialog: false,
    }
  },
  
  methods: {
    doSomethingOnReady() {
        this.map = this.$refs.myMap.mapObject;
        this.changeMapToLocation()
    },

    async downloadGeoJson(lat, log) {
      const url = lat && log ? `/.netlify/functions/route?latitude=${lat}&longitude=${log}` : `/.netlify/functions/route`
      const response = await this.$axios.get(url);
      this.data = await response.data;

      let geojson = {
        type: "FeatureCollection",
        features: []
      };
      let path = {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": []
        }
      }
      this.total=0
      this.data.forEach( d=>{
        let add = {
          type: "Feature",
          properties: {
              description: d.body,
              name: d.name,
              image: d.images.length ? d.images[0] : '',
              web: d.web
          },
          geometry: {
              type: "Point",
              coordinates: [d.longitude,d.latitude]
          }
        }
        geojson.features.push(add)
        path.geometry.coordinates.push([d.longitude, d.latitude])
        this.total++
      })
      geojson.features.push( path )
      this.geojson = geojson
      this.zoom = 14;    

      this.sidebar = L.control.sidebar({
          container: 'sidebar'
      }).addTo(this.map);

      this.$nextTick(() => this.centerAtStartup())
    },

    centerAtStartup(){
      this.current=0;
      this.flyTo();
    },

    flyTo(){
      this.showPrev= !(this.current == 0)
      this.showNext= !(this.current == this.total-1)
      this.currentItem = this.geojson.features[this.current]
      this.map.flyTo(L.latLng(this.currentItem.geometry.coordinates[1], this.currentItem.geometry.coordinates[0]), 18)
      this.showInfo(this.currentItem.properties)
    },

    changeMap(){      
      this.$nextTick( ()=> this.downloadGeoJson() )
    },

    changeMapToLocation(){
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition( (position)=>{
          this.$nextTick( ()=> this.downloadGeoJson(position.coords.latitude, position.coords.longitude) )
        }, ()=>{
          this.$nextTick( ()=> this.downloadGeoJson() )  
        });
      } else {
        alert("No tienes el geolocation, sorry")
        this.$nextTick( ()=> this.downloadGeoJson() )
      }      
    },

    whenClicked(e){
      const prp = e.target.feature.properties;
      this.showInfo(prp)
    },

    showInfo(prp){
      this.currentItem=prp
      this.currentWeb = prp.web
      this.currentImage = prp.image
      this.currentBody = this.currentItem.description.substring(0,200)
      this.currentTitle = this.currentItem.name      
    },

    gotoNext(){
      this.current++
      if( this.current >= this.geojson.features.length-1)
        this.current--;
      this.flyTo()
    },

    gotoPrev(){
      this.current--
      if( this.current < 0)
        this.current = 0;
      this.flyTo()
    }
  },

  computed:{
    options() {
      return {
        onEachFeature: this.onEachFeatureFunction
      };
    },
    onEachFeatureFunction() {
      return (feature, layer) => {
        if( !feature.properties )
          return
        layer.on({
          click: this.whenClicked
        });
      };
    }
  },

  async mounted(){        
  },

}
</script>
<style>
#map {
    max-width: 100%;
    margin: 0;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100vh;
    display: flex;
}
.vue2leaflet-map{
  height: 100vh;
  width: 100%;
}
#sidebar {
  height: 80vh;
}
</style>