
//There are three types of plot: gauge (horizontal bar), pie and line

function plot_gauge(tagstart,my_pollutant,my_list,g_type){

  //horizontal bar gauges - with limit bars
  //this function draws two types of gauge - limit or max

  //set ranges for different pollutants
  range_mean = {NO2:40,PM10:40};
  range_limit = {NO2:18,PM10:35};

  //set tag name
  tdname = tagstart + g_type


  //create years list
  years = []
  for (l in my_list){
      years.push(my_list[l].year)
  }

  //clear svg
  d3.select(tdname).selectAll("*").remove()

  //draw svg
  var svg = d3.select(tdname).append("svg")
   .attr("class","gauge")
   .append("g");

   //define max
   max_val = d3.max(my_list, function(d) { return d[g_type]; })
   //work out domain end
   if (range_mean[my_pollutant] > max_val){
     max_val = range_mean[my_pollutant]+10
   }

    //define scales (x,y)
    var x_scale = d3.scale.linear().domain([0,max_val+5]).range([0, 175]);
    var y_scale = d3.scale.ordinal().domain(years).range([20,0]);

    //define and append axes
    svg.append("g")
      .attr("class", "x_axis")
      .attr("transform", "translate(35,60)")
      .call(d3.svg.axis().scale(x_scale).orient('bottom').tickSize(0).outerTickSize(0).ticks(8))

    svg.append("g")
      .attr("class", "y_axis")
      .attr("transform", "translate(35,30)")
      .call(d3.svg.axis().scale(y_scale).orient('left').tickSize(0).outerTickSize(0));

    //append data to bars
    var bars = svg.selectAll(".bar").data(my_list);

    //draw the bars
    bars.enter().append("rect")
    .attr("class", "bar")
    .attr("x", 35)
      .attr("fill",'darkgrey')//default fill
      .attr("width", function(d) {  return x_scale(d[g_type]); })
      .attr("y", function(d){  return y_scale(d.year) + 20; })
      .attr("height", 15);
    bars.exit().remove();

    //add delimiter axis with 'limit' label
    svg.append("g")
      .attr("class", "z_axis")
      .attr("transform", "translate(" + (35 + x_scale(range_mean[my_pollutant])) + ",17)")
      .call(d3.svg.axis().scale(d3.scale.linear().domain([0,10]).range([40,0])).orient('left').tickValues([]).outerTickSize(0));

    svg.append("text")
      .attr("y", 15)
      .attr("x",(35 + x_scale(range_mean[my_pollutant])))
      .html('limit')
      .attr('text-anchor','middle');

};

function plot_pie(tagname, my_pollutant,my_data,time_type) {


  //these pie charts have been adapted from a resuable circular heat chart
  //found here: http://prcweb.co.uk/lab/circularheat/

  //clear svg
  d3.select(tagname).selectAll("*").remove()

  //define label lists
  var weeks = ["Sun", "Sat", "Fri", "Thurs", "Wed", "Tues","Mon"],
  hours = ["12pm", "1am", "2am", "3am", "4am", "5am", "6am", "7am", "8am", "9am", "10am",
  "11am", "12am", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm", "8pm", "9pm", "10pm", "11pm"],
  years = ["December","November", "October", "September", "August", "July", "June",'May','April','March','February','January'],
  dates = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th",
  "12th", "13th", "14th", "15th", "16th", "17th", "18th", "19th", "20th", "21st", "22nd",
  "23rd", "24th","25th",'26th','27th','28th','29th','30th','31st'];


  //define pie variables
  var segments = {weeks:24,years:31},
  segment_heights = {weeks:16,years:9}
  margin = {top: 10, right: 10, bottom: 0, left: 20},
  numSegments = segments[time_type],
  segmentHeight = segment_heights[time_type],
  innerRadius=15,
  accessor = function(d) {return d;};

  //define colour scales - different for NO2, PM10 and grey
  //Pollutant scales correspond to AQI limits: https://uk-air.defra.gov.uk/air-pollution/daqi?view=more-info&my_pollutant=no2#my_pollutant

  if (my_pollutant=='NO2'){
    var wheel_color = d3.scale.threshold()
        .domain([67/4,67, 134, 200, 267, 334,400,467,534,600])
        .range(["white","#D8DA00", "#3AAA35", "#006633", "#F9CC12", "#F9B233", "#F39200","#E94E1B", "#E30613", "#BE1622", "#662483"]);

  } else if (my_pollutant =='PM10') {

    var wheel_color = d3.scale.threshold()
        .domain([16/4, 16, 33, 50, 58, 66,75,83,91,100])
        .range(["white","#D8DA00", "#3AAA35", "#006633", "#F9CC12", "#F9B233", "#F39200","#E94E1B", "#E30613", "#BE1622", "#662483"]);
  } else{
    my_min = d3.min(my_data, function(d) { return +d.value; });
    my_max = d3.max(my_data, function(d) { return +d.value; });

    var wheel_color = d3.scale.linear()
        .domain([my_min,my_max])
        .range(["white","#303030"]);

  }

  //Arc functions
  //data feeds from the inside out

  //Inner Radius: increases dependent on place in wheel
  ir = function(d, i) {
      result =  innerRadius + Math.floor(i/numSegments) * segmentHeight;
      return result;}

  //Outer Radius: increases dependent on place in wheel
  or = function(d, i) {
      result =  innerRadius + segmentHeight + Math.floor(i/numSegments) * segmentHeight;
      return result;
  }

  //Start Angle: dependent on position in each cycle
  sa = function(d, i) {
      result =  (i * 2 * Math.PI) / numSegments;
      return result;
  }

  //End Angle: dependent on position in each 24  cycle + 1
  ea = function(d, i) {
      result = ((i+1) * 2 * Math.PI) / numSegments
      return result;
  }


  //populate data list
  data_list = []
  my_data.forEach(function(d) {
      data_list.push(d.value);
      });

  //new svg for each pie
  var svg = d3.select(tagname).attr("class","pie").selectAll('svg')
              .data([data_list]);
  svg.enter().append('svg');
  svg.exit().remove();

  //used for labels
  var offset = innerRadius + Math.ceil(data_list.length / numSegments) * segmentHeight;

  //append a new group to the svg.
  var g = svg.append("g")
      .classed("circular-heat", true)
      .attr("transform", "translate(" + parseInt(margin.left + offset) + "," + parseInt(margin.top + offset) + ")");

  //define tooltip
  var small_tooltip = d3.select("body")
    .append("div")
    .attr("class", "small_tooltip")
    .html("");

  //new set of paths for each pie
  var paths = g.selectAll("path").data(data_list);

  //draw the paths
  paths.enter().append("path")
      .attr("d", d3.svg.arc().innerRadius(ir).outerRadius(or).startAngle(sa).endAngle(ea))
      .attr("fill", function(d) {return wheel_color(accessor(d));})
      .on("mouseover", function(d){
        d3.select(this).attr('opacity',0.4)
        tip = parseInt(d) + ' &#181;g m-3'
        small_tooltip.html(tip)
        return small_tooltip.style("visibility", "visible");
      })
       .on("mousemove", function(){return small_tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
       .on("mouseout", function(){
         d3.select(this).attr('opacity',1)
         return small_tooltip.style("visibility", "hidden");});

  //and remove them
  paths.exit().remove();

  // Unique id so that the text path defs are unique - P Cook comment
  var id = d3.selectAll(".circular-heat")[0].length;

  //Radial labels - weeks and months

  var lsa = 0.01; //Label start angle

  //create new labels
  var labels = svg.append("g")
      .classed("labels", true)
      .classed("radial", true)
      .attr("transform", "translate(" + parseInt(margin.left + offset) + "," + parseInt(margin.top + offset) + ")");

  //append the data and calculate position (this is also from circular heat map)
  //will work out how to function this one later

  function set_labels(my_data){
    //set labels using correct dataset - weeks or years (dependent on time_type)
    labels.selectAll("def").data(my_data)
          .enter()
          .append("def")
          .append("path")
          .attr("id", function(d, i) {return "radial-label-path-"+id+"-"+i;})
          .attr("d", function(d, i) {
              //radius relates to segment height
              var r = innerRadius + ((i + 0.2) * segmentHeight);
              return "m" + r * Math.sin(lsa) + " -" + r * Math.cos(lsa) +
                      " a" + r + " " + r + " 0 1 1 -1 0";});
  }

  if (time_type=='weeks'){
    set_labels(weeks)
  } else{
    set_labels(years)

  }

  //append text to each label
  if (time_type=='weeks'){
    var weeks = labels.selectAll("text").data(weeks);
  } else{
    var weeks = labels.selectAll("text").data(years);
  }

  //week labels
  weeks.enter()
      .append("text")
      .append("textPath")
      .attr("xlink:href", function(d, i) {return "#radial-label-path-"+id+"-"+i;})
      .style("font-size", 1.2 * segmentHeight + 'px')
      .text(function(d) {return d;});

  weeks.exit().remove()

  //same again for segment labels
  var segmentLabelOffset = 2;
  //radius relates to position in the cycle
  var r = innerRadius + Math.ceil(data_list.length / numSegments) * segmentHeight + segmentLabelOffset;

  //append labels to svg
  var outer_labels = svg.append("g")
      .classed("labels", true)
      .classed("segment", true)
      .attr("transform", "translate(" + parseInt(margin.left + offset) + "," + parseInt(margin.top + offset) + ")");

  //now append to path
  outer_labels.append("def")
      .append("path")
      .attr("id", "segment-label-path-"+id)
      .attr("d", "m0 -" + r + " a" + r + " " + r + " 0 1 1 -1 0");

  //and draw - again, I'll find a way to function these later
  outer_labels.selectAll('text').remove()

  function set_outerlabels(my_data){
    //set labels using correct dataset - weeks or years (dependent on time_type)
    outer_labels.selectAll("text").data(my_data)
        .enter()
        .append("text")
        .append("textPath")
        .style("font-size", '12px')
        .attr("xlink:href", "#segment-label-path-"+id)
        .attr("startOffset", function(d, i) { return i * 100 / numSegments + "%";})
        .text(function(d) {return d;});

  }
  if (time_type=='weeks'){
    set_outerlabels(hours)

  } else{
    set_outerlabels(dates)
  }

  //finished with pie charts

}

function line_opacity(){
  //resets line opacity after tooltip - copy of function in air_final as out of scope

  var boxes = document.querySelectorAll('input[name="line"]');
  for (i = 0; i < boxes.length; ++i) {
      if (boxes[i].checked == true){
        d3.selectAll("." + boxes[i].value).attr('opacity',1)
      } else{
        d3.selectAll("." + boxes[i].value).attr('opacity',0.2)
      }

    }
}
function draw_yaxis(my_type,svg,my_data,x_scale,tooltip,colour){

  //draws a separate line and y axis for each data type

  //define legend labels
  var labels = {NO2:"NO2",PM10:"PM10",weather: "wind speed",parking: "parking capacity"}

  //get min and max
  min_y = d3.min(my_data, function(d) { return +d.value; })
  max_y = d3.max(my_data, function(d) { return +d.value; })

  //draw scale and axis
  var y_scale = d3.scale.linear().domain([min_y,max_y]).range([130,10]);

  var y_axis = d3.svg.axis().scale(y_scale).orient("left")
                            .tickValues([min_y,max_y])
                            .tickSize(0)
                            .tickFormat(function(d,i){if (d==min_y){return 'min'}else{return 'max'} });

  //append new axis
  svg.append("g").attr("class", my_type + "_axis").attr("transform", "translate(30,20)").call(y_axis);

  //define the line
  var my_line = d3.svg.line()
        .x(function(d) {

          return x_scale(d.order); })
        .y(function(d) { return y_scale(d.value); });

  //draw the line and set the tooltip using returned scale so active after running
    svg.append("path").attr("class", my_type)
              .data(my_data)
              .attr("transform", "translate(30," + 20 + ")")
              .attr("data-legend",function(d) { return labels[d.type]})
              .attr("opacity",0.2)
              .style("stroke",colour)
              .on("mouseover", function(d){
                //set opacity to 1 so you can see what you're hovering over
                d3.select(this).attr('opacity',1)
                //adds text to the tooltip
                //gets the co-ordinates of the mouse on the SVG and works out the y value with inverted scale
                var coordinates = [0, 0];
                coordinates = d3.mouse(this);
                var y = coordinates[1];
                my_class = d3.select(this).attr('class')
                if (my_class == 'NO2'){
                  tip = 'NO2: ' + parseInt(NO2_scale.invert(y)) + ' &#181;g m-3'
                } else if (my_class == 'weather') {
                  tip = "Wind Speed: " + parseInt(weather_scale.invert(y)) + ' km/h'
                } else if (my_class == 'PM10') {
                  tip = "PM10: " + parseInt(PM10_scale.invert(y)) + ' &#181;g m-3'
                } else {
                  tip = "Parking Capacity: " + parseInt(parking_scale.invert(y)) + ' %'
                }
                tooltip.html(tip)
                return tooltip.style("visibility", "visible");
              })
               .on("mousemove", function(){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
               .on("mouseout", function(){
                 line_opacity();
                 return tooltip.style("visibility", "hidden");})
              .attr("d", my_line(my_data));

    return y_scale
}


function plot_line(tagname,my_data,time_type){


  //defines the x axis labels
  var weeks_labels = {12:"Sun",36:"Sat", 60:"Fri", 84:"Thurs", 108:"Wed", 132:"Tues", 156:"Mon"},
  years_labels = {15:"Dec",46:"Nov",77:"Oct",108:"Sept",139:"Aug",170: "Jul", 201:"Jun",232:'May',
  263:'Apr',294:'Mar',325:'Feb',358:'Jan'},
  weeks_ticks = [12,36,60, 84, 108, 132, 156],
  years_ticks = [15,46,77, 108, 139, 170, 201,232,263,294,325,358];


  //clears the svg
  d3.select(tagname).selectAll("*").remove();

  //filters the data for each type (can add as many as you want)
  NO2_data = my_data.filter(function(d) {return d.type=='air' && d.pollutant == 'NO2' && d.value>0})
  PM10_data = my_data.filter(function(d) {return d.type=='air' && d.pollutant == 'PM10' && d.value>0})
  parking_data = my_data.filter(function(d) {return d.type=='parking' && d.value>0})
  weather_data = my_data.filter(function(d) {return d.type=='weather' && d.value>0})


  //used to set x_scale max
  data_totals = {weeks:167,years:371}

  //create svg
  var svg = d3.select(tagname).append("svg").style("width",800);

  //set x_scale
  var x_scale = d3.scale.linear().domain([data_totals[time_type],0]).range([0, 780]);

  //define tooltip
  var tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .html("");

  //define  x axis
  var x_axis = d3.svg.axis().scale(x_scale).orient("bottom");


  // set x_axis ticks - break points in tickValues (every 24 hours/31 days)
  // tickFormat changes to corresponding str in weeks or years_labels
  if (time_type == 'weeks'){
    x_axis.tickValues(weeks_ticks).tickSize(0).tickFormat(function(d, i){return weeks_labels[d]});
  } else{
    x_axis.tickValues(years_ticks).tickSize(0).tickFormat(function(d, i){return years_labels[d]});
  }

  //append x-axis
  svg.append("g").attr("class", "x_axis")
        .attr("transform", "translate(30,160)")
        .style("text-anchor", "end")
        .call(x_axis)


  //draw dividing lines axes - 12am or 1st of month
  var m_scale =  d3.scale.linear().domain([0,10]).range([130,0]);
  var m_axis = d3.svg.axis().scale(m_scale).orient("left").tickSize(0).ticks(0);


  function add_m_axis(position, my_label){

    svg.append("g")
      .attr("class", "m_axis")
      .attr("transform", "translate(" + position + ",30)")
      .call(m_axis);

    svg.append("text")
      .attr("y", 25)
      .attr("x",position)
      .style('fill','grey')
      .style('opacity',0.8)
      .html(my_label)
      .attr('text-anchor','middle');
  };


  if (time_type == 'weeks'){
    for (i = 0; i < weeks_ticks.length; ++i) {
      add_m_axis(x_scale(weeks_ticks[i])+30,'12am')
    }
  } else{
    for (i = 0; i < years_ticks.length; ++i) {
      add_m_axis(x_scale(years_ticks[i]),'1st')
    }
  }


  //finally add the lines
  weather_scale = draw_yaxis('weather',svg,weather_data,x_scale,tooltip,'deepskyblue')
  parking_scale = draw_yaxis('parking',svg,parking_data,x_scale,tooltip,'blue')
  NO2_scale = draw_yaxis('NO2',svg,NO2_data,x_scale,tooltip,'#D8DA00')
  PM10_scale = draw_yaxis('PM10',svg,PM10_data,x_scale,tooltip,'#8dc109')

  //done with line chart
}
