var mobileSettings = {
  'center': '34.0983425, -118.3267434',
  'zoom': 10
}; // Default to Hollywood, CA when no geolocation support

////////////////////////////////////////////////////////////
$('#places').live('pageinit', function() {
  // Reset search input  
  $('#places-search').val('');
  $('.logo').delay(3000).fadeIn('slow');
  // gmap
  demo.add('places_1', function() {
    $('#map_canvas').gmap({
      'center': mobileSettings.center,
      'zoom': 10,
      'disableDefaultUI': false,
      mapTypeControl: false,
      panControl: false,
      streetViewControl: false,
      zoomControlOptions: {
        position: google.maps.ControlPosition.LEFT_BOTTOM
      },
      'callback': function() {
        // map current position from client lat/long
        var self = this;
        self.getCurrentPosition(function(position, status) {
          if (status === 'OK') {
            self.set('clientPosition', new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
            self.set('bounds', null);
            self.addMarker({
              'position': self.get('clientPosition'),
              'bounds': null
            });
          }
          // fetch locations
          var lat1 = position.coords.latitude;
          var lon1 = position.coords.longitude;
          var radius = 2;
          getLocations(lat1, lon1, radius);
        });
        // map search results from user input
        var control = self.get('control', function() {
          self.autocomplete($('#places-search')[0], function(ui) {
            // Hide the details view
            $('#map_canvas').css('height', '100%');
            // Hide header
            $('#container').hide();
            //self.clear('markers');
            self.set('bounds', null);
            self.placesSearch({
              'location': ui.item.position,
              'radius': '5000'
            }, function(results, status) {
              if (status === 'OK') {
                // fetch locations
                var lat1 = ui.item.position["k"];
                var lon1 = ui.item.position["A"];
                var radius = 2;
                getLocations(lat1, lon1, radius);
              }
            });
          });
          return $('#control')[0];
        });

        // fetch location data and build markers
        function getLocations(lat1, lon1, radius) {
          $.ajaxSetup({
            cache: false
          });
          //var onlocationAPI = 'http://localhost/onlocation/api/?jsoncallback=?';
          var onlocationAPI = 'http://www.dawsoninteractive.com/onlocation/api/?jsoncallback=?';
          $.getJSON(onlocationAPI, {
            method: "get_markers",
            latitude: lat1,
            longitude: lon1,
            distance: radius
          }, function(data) {
            $.each(data.markers, function(i, marker) {
              //if (distance(lat1, lon1, marker.latitude, marker.longitude, 'M') < radius) {
                self.addMarker({
                  'position': new google.maps.LatLng(marker.latitude, marker.longitude),
                  'bounds': true,
                  'icon': 'images/marker.png',
                  'title': marker.location
                }).click(function() {
                  // Iterate through movies and videos    
                  var moviecount = 0;
                  var videocount = 0;
                  var images = '';
                  moviesglobal = marker.movies;
                  $.each(marker.movies, function(i, movie) {
                    if (movie.image) {
                      images += '<li><a href="#" /><img src="' + movie.image + '" class="thumb" alt="' + movie.title + '" title="' + movie.title + '" /><\/a><\/li>';
                    } else {
                      images += '<li class="placeholder"><a href="#" />' + movie.title + '<\/a><\/li>';
                    }
                    moviecount++
                  });
                  $.each(marker.videos, function(i, video) {
                    videocount++
                  });
                  var content = '<h2 class="location" lat="' + marker.latitude + '" long="' + marker.longitude + '" moviecount="' + moviecount + '" videocount="' + videocount + '" ><a href="#">' + marker.location + '<\/a><\/h2>' + '<div class="count">' + '<a href="#"><span class="movie-count">' + moviecount + ' Movies<\/span><\/a>' + '<a href="#"><span class="video-count">' + videocount + ' Videos<\/span><\/a>' + '<\/div>' + '<ul class="thumbs">' + images + '<\/ul>' + '<div class=""><\/div>';
                  self.openInfoWindow({
                    'content': content
                  }, this);
                });
              //}
            });
          });
        }
        self.addControl(new control(), 1);
      }
    });
  }).load('places_1');
});


$('h2.location a').live('click', function() {
  var href = $(this).attr('href');
  var title = $(this).html();
  var moviecount = $(this).parent().attr('moviecount');
  var videocount = $(this).parent().attr('videocount');
  var latitude = $(this).parent().attr('lat');
  var longitude = $(this).parent().attr('long');
  var streetview = "http://maps.googleapis.com/maps/api/streetview?size=360x110&location=" + latitude + "," + longitude + "&sensor=false";
  // Close the info window
  $('#map_canvas').gmap('get', 'iw').close();
  // Load the details view
  $('#map_canvas').css('height', '40%');
  var movies = '';
  $.each(moviesglobal, function(i, movie) {
    if ( !movie.image ) {
      movie.image = 'images/placeholder.png';
    }
    movies += '<li>';
    movies += '<img class="thumb" src="' + movie.image + '" title="" alt="" />';
    movies += '<div class="info">';
    movies += '<h2 class="title">' + movie.title + '</h2>';
    movies += '<p class="description">' + movie.description + '</p>';
    //if ( movie.video ) {
      movies += '<p class="video"><img src="images/marker.png" height="15"/><a href="#">Watch 1 video on location</a></p>';
    //}
    movies += '</div>';
    movies += '</li>';
  });
  $('#details #movies ul').html(movies);
  // Display header
  $('#overlay h1.location').text(title);
  $('#overlay img.streetview').attr('src', streetview);
  $('#overlay .movie-count').text(moviecount);
  $('#overlay .video-count').text(videocount);
  $('#container').fadeIn();
});

$('h1.logo').live('click', function() {
  location.reload();
});


$('#container').live('click', function() {
  $(this).fadeOut();
  $('#map_canvas').css('height', '100%');
});

if(navigator.userAgent.match(/iP[ha][od].*OS 7/)) {
  document.write('<style type="text/css">#places .ui-content{padding-top:20px;}</style>');
}

//$('#movies p.video').live('click', function() {
  //$('#movies').hide();
  //$('#videos').show();
//});


// Calculate distance between two points based on Haversine formula
 // http://www.geodatasource.com/developers/javascript
 // lat1, lon1 = Latitude and Longitude of point 1 (in decimal degrees)
 // lat2, lon2 = Latitude and Longitude of point 2 (in decimal degrees)
 // unit = ( M = statute miles, K = kilometers, N = nautical miles )

function distance(lat1, lon1, lat2, lon2, unit) {
  var radlat1 = Math.PI * lat1 / 180
  var radlat2 = Math.PI * lat2 / 180
  var radlon1 = Math.PI * lon1 / 180
  var radlon2 = Math.PI * lon2 / 180
  var theta = lon1 - lon2
  var radtheta = Math.PI * theta / 180
  var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  dist = Math.acos(dist)
  dist = dist * 180 / Math.PI
  dist = dist * 60 * 1.1515
  if (unit == "K") {
    dist = dist * 1.609344
  }
  if (unit == "N") {
    dist = dist * 0.8684
  }
  return dist
}

function successCB(data) {
  console.log("Success callback: " + data);
  return data;
};

function errorCB(data) {
  console.log("Error callback: " + data);
  return false;
};