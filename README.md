Air Quality Dashboard using data from [Bath Hacked Data Store](https://data.bathhacked.org/Environment/-Live-Air-Quality-Sensor-Data/hqr9-djir).

The dashboard looks at average NO2 and PM10 readings over two complete years of data - 2015 and 2016 - from four different air sensors.

Report on Sensor Data Errors can be found [here](http://www.bmdata.co.uk/air.html).

GIST includes 7 files:

* air_vis.py - python file which wrangles data into required format
* all_data.csv - chart data initally formatted to fit adapted [Peter Cook circular heat map](http://prcweb.co.uk/circularheatchart/) also used for line chart
* stats.csv - separate calculations for DEFRA bar charts
* index.html
* air_final.js - main javascript code
* air_plots.js - separate code for three chart types
* air.css

Final working example with images can be found [here](http://www.bmdata.co.uk/bathhacked)