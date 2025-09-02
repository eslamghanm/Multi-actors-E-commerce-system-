
let display = document.getElementById("display");
let content = document.getElementById("content");

console.log(display);
display.addEventListener("click" , ()=>{

    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(getLocation , errorHandelar);
}
else{
    alert("allow to open your location ");
}
})
function getLocation(e){
    console.log(e);
  lat = e.coords.latitude;
  lon = e.coords.longitude;
  var location = new google.maps.LatLng(lat, lon);
  //2- specify specs of map : zoom : , center
  var specs = { zoom: 17, center: location };
  // 3 retrive map and display map
  new google.maps.Map(content, specs);
}
function errorHandelar(){
alert("can't access your location");
}