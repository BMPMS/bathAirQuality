d3.csv("all_data.csv", function(error, data) {
  d3.csv('stats.csv', function(error, stats) {

  if (error) throw error;

  //pollutant description text

  NO2_text = "<br>Nitrogen dioxide (NO2) is of concern to public health" +
  " in high concentrations. Combustion emissions (NOx) oxidise in the" +
    " atmosphere to form NO2.";

  PM10_text = "<br>Particulate matter (PM10) less than or equal to 10 micrometers (microns) " +
   "which in high concentrations are of concern to public health."


 //1. Code to make input/radio buttons responsive - functions first

 function change_buttons(what,text){
     //disables or enables Guildhall and London Road Aurn depending on current pollutant_text
     //sets the pollutant description text
     document.querySelector('input[name="station"]#lra').disabled = what;
     document.querySelector('input[name="station"]#guild').disabled = what;
     document.getElementById('pollutant_text').innerHTML = text;
 }

   function set_stations(){
     //calls change_buttons depending on current pollutant
     if(current_pollutant=='PM10'){
        change_buttons(true,PM10_text)
      } else{
        change_buttons(false,NO2_text)
      }
   }

   function set_vars(){
     //resets current_pollutant, station, time_type - used every time an input is changed
     current_pollutant = document.querySelector('input[name="pollutant"]:checked').value
     station = document.querySelector('input[name="station"]:checked').value
     time_type = document.querySelector('input[name="time"]:checked').value
   }

   //function for the line checkboxes - selects or deselects lines.
   function line_opacity(){
     var boxes = document.querySelectorAll('input[name="line"]');
     for (i = 0; i < boxes.length; ++i) {
         if (boxes[i].checked == true){
           d3.selectAll("." + boxes[i].value).attr('opacity',1)
         } else{
           d3.selectAll("." + boxes[i].value).attr('opacity',0.2)
         }

       }
   }

   //Station Radio Button
    d3.selectAll('input[name="station"]')
    .on('change', function() {
      set_map();
      set_vars();
      draw_charts();
    })

    //Time Radio Button - Years or Weeks
    d3.selectAll('input[name="time"]')
    .on('change', function() {
      set_vars();
      draw_charts()
    })

    //Pollutant Radio Button
    d3.selectAll('input[name="pollutant"]')
    .on('change', function() {
      set_vars();
      //alert and action to stop user clicking PM10 when Guildhall or London Road Aurn selected
      if ((station == 'guildhall' | station == 'londonrdaurn') & (current_pollutant == 'PM10')){
        window.alert('There is no PM10 data for the selected station');
        document.querySelector('input[name="pollutant"]#NO2').checked = true;
        current_pollutant = 'NO2'
      }
      set_stations()
      draw_charts()
      set_map()
    });

    //Line Checkboxes
    d3.selectAll('input[name="line"]')
    .on('change', function() {
      line_opacity();

    });

    //2. Define Map co-ordinates, text strings and function

    markers = {guildhall: "51.3822189160466,-2.35903402755172",
    londonrdaurn: "51.3911037707408,-2.35406675237005", windsorbridge:"51.3822463964832,-2.3816082523437",
    londonrdenc: "51.3911430437405,-2.35463418737194"}

    PM10_markers = {windsorbridge:"51.3822463964832,-2.3816082523437",
    londonrdenc: "51.3911430437405,-2.35463418737194"}

    urll = "https://maps.googleapis.com/maps/api/staticmap?"
    marker_text = "markers=color:blue%7Csize:mid%7C"
    urlr = "center=51.3866434,-2.3672184&zoom=13&size=290x140&key=AIzaSyBbtg5sbWajRdAL4RbZsXYrOZwSB_yXYRI"

    function set_map(){

      if (station == "all"){
          src = urll
          //different 'alls' depending on the pollutant
          if (current_pollutant == 'PM10'){
            for (m in PM10_markers){
              src = src + marker_text + PM10_markers[m] + "&"
            }
          }else{
            for (m in markers){
              src = src + marker_text + markers[m] + "&"
            }
          }
          src = src + urlr

      }else{
        //otherwise just one marker.
        src = urll + marker_text + markers[station] + "&" + urlr
      }
      d3.select('#map')[0][0].src = src;
    }

    //3. Define and set key input variables
    var current_pollutant = document.querySelector('input[name="pollutant"]:checked').value;
    var station = document.querySelector('input[name="station"]:checked').value;
    var time_type = document.querySelector('input[name="time"]:checked').value;

    //4. Set the map (default ALL and NO2) and draw the charts.
    set_map()
    draw_charts()



   function draw_charts(){

       //1. Pie charts: filter data
       var filtered_pie = data.filter(function(d) {
           return d.station==station &&
           d.pollutant==current_pollutant && d.timing==time_type
           && d.type=='air';
        ;});

        //then draw
        plot_pie('#pie', current_pollutant,filtered_pie,time_type)
        plot_pie('#greypie', 'grey',filtered_pie,time_type)

       //2. Bar charts filter data
       var filtered_bar = stats.filter(function(d){
         return d.station==station && d.pollutant==current_pollutant
       });

      //then draw
      plot_gauge('#',current_pollutant,filtered_bar,'max')
      plot_gauge('#',current_pollutant,filtered_bar,'limit')


       //3. Line charts: filter data -  different for air v weather/parking
       var filtered_line = data.filter(function(d) {
           if (d.type =='air'){
             return d.station==station && d.timing==time_type;
           } else{
             return d.timing==time_type;
           }
         ;});

      //then draw
      plot_line('#line',filtered_line,time_type)

      //set limits (for bar chart labels)
      limits = {NO2:200,PM10:50};

      //set bar plots labels depending on pollutant
      document.getElementById('labelmax').innerHTML = "3. Annual average (&#181;g m-3)";
      if (current_pollutant == 'PM10'){
        limit_text = '2. High Readings > 50 &#181;g m-3'
      } else {
        limit_text = '2. High Readings > 200  &#181;g m-3'
      }
        document.getElementById('labellimit').innerHTML = limit_text
      }

    });
    

});
