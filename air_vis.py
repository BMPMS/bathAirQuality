import pandas as pd
import numpy as np
from datetime import date
from dateutil.rrule import rrule, DAILY

#1. Define functions

def add_fields(my_list, my_order,my_type,s,p,timing):
    #builds years and weeks dataframes using two list
    new_df = pd.DataFrame(my_list,columns=['value'])
    new_df['order'] = my_order
    new_df['station'] = s
    new_df['pollutant'] = p
    new_df['type'] = my_type
    new_df['timing'] = timing

    return new_df

def day_hour(df,p,s,my_type):
    #builds a list of means for pollutant p and station p
    #weekday Sun-Mon, hours 1-24, plus order value (for d3 circular chart)

    my_list = []
    my_order = []
    x = 0

    #required day order: Sun,Sat,Fri,Thurs,Wed,Tues,Mon
    day_order = [0,6,5,4,3,2,1]

    for my_day in day_order:
        for my_hour in range(0,24):
            df_sub = df[(df['hour']==str(my_hour)) & (df['weekday']==str(my_day))]
            if len(df_sub) > 0:
                my_mean = np.mean(df_sub[p])
            else:
                my_mean = 0
            my_list.append(my_mean)
            my_order.append(x)
            x = x + 1


    new_df = add_fields(my_list, my_order,my_type,s,p,"weeks")


    return new_df


def month_day(df,p,s,my_type):
    #builds a list of means for pollutant p and station p
    #months 1-12, days 1-31, plus order value (for d3 circular chart)

    my_list = []
    my_order = []
    x = 0

    #required month order: December, November ... January
    for my_month in range(12, 0, -1):
        for my_day in range(1,32):
            df_sub = df[(df['monthday']==str(my_day)) & (df['month']==str(my_month))]
            if len(df_sub) > 0:
                my_mean = np.mean(df_sub[p])
            else:
                my_mean = 0
            my_list.append(my_mean)
            my_order.append(x)
            x = x + 1

    new_df = add_fields(my_list, my_order,my_type,s,p,"years")


    return new_df

def set_dates(df,fieldname):

    #uses strftime to set date fields
    df[fieldname]= pd.to_datetime(df[fieldname])
    df['hour'] = df[fieldname].dt.strftime('%-H')
    df['weekday']= df[fieldname].dt.strftime('%w')
    df['month']= df[fieldname].dt.strftime('%-m')
    df['monthday']= df[fieldname].dt.strftime('%-d')
    df['year']= df[fieldname].dt.strftime('%Y')

    return df

def weeks_years(all_data,df,p,s,my_type):

    #builds weeks and years dataframes using functions above
    my_weeks = day_hour(df,p,s,my_type)
    all_data = pd.concat([all_data, my_weeks])
    my_years = month_day(df,p,s,my_type)
    all_data = pd.concat([all_data, my_years])

    return all_data

def bar_data(df,p,s,limit,stats):

    #calculate stats for 2 DEFRA measures

    #1. average annual mean
    df1 = df[p].groupby(df['year']).mean().reset_index('year')
    df1 = pd.DataFrame(df1)

    #2. Number of entries over the limit
    if s == 'all':
        df2 = df[df[p]>limit]
    else:
        df2 = df[(df[p]>limit) & (df['station']==s)]

    #concatinate results and rename columns after groupby
    if len(df2)>0:
        df2 = df2[p].groupby(df2['year']).size().reset_index('year')
        df2 = pd.DataFrame(df2)
        new_stats = pd.merge(pd.DataFrame(df1), pd.DataFrame(df2), on='year',how='left')
        new_stats=new_stats.rename(columns = {0:'limit'})
    else:
        new_stats = df1
        new_stats['limit']=0

    new_stats['station']=s
    new_stats['pollutant']=p

    new_stats=new_stats.rename(columns = {p:'max'})

    if s =='all':
        #hard coded.  account for number of stations involved.
        if p=='NO2' or p=='NOx':
            new_stats['limit'] = new_stats['limit']/4
        elif p=='PM10':
            new_stats['limit'] = new_stats['limit']/2

    stats = pd.concat([stats, new_stats])
    stats = stats.fillna(0)

    return stats



#2. Open static data files for air quality, weather and parking

air = pd.read_csv("_Live__Air_Quality_Sensor_Data.csv",index_col=False)
weather = pd.read_csv('weather_latest.csv')
parking = pd.read_csv('Historical_car_parking.csv')

air['station'] = air['Sensor Location Slug']

#3. Define pollutant and stations of interest
pollutants = [['NO2',200],['PM10',50]]
stations = ['guildhall','londonrdaurn','londonrdenc','windsorbridge']

#4. Set dates, restrict data to 2015 and 2016 (only full years of data)
air = set_dates(air,"DateTime")
air = air[(air['year']=='2015') | (air['year']=='2016')]
weather = set_dates(weather,"time")
parking = set_dates(parking,'DateUploaded')

#5. Define all data dataframe
cols2 = ['type','pollutant','station','value','order','timing']
all_data = pd.DataFrame(columns=cols2)

#6. Define stats dataframe (for DEFRA measure bar charts/gauges)
cols = ['station','pollutant','year','limit', 'max']
stats = pd.DataFrame(columns=cols)


#for each pollutant
for p in pollutants:

    #remove nulls and negatives
    p_air = air[air[p[0]].isnull()==False]
    p_air = p_air[p_air[p[0]]>0]

    #remove any entries over the limit - dealing with high reading errors
    #current limits set at the DEFRA AQI first 'high' level for each pollutant

    if p[0] == 'NO2':
        limit = 400
    elif p[0]=='PM10':
        limit = 75

    p_air = p_air[p_air[p[0]]<limit]

    #build stats and all_data dataframe for all stations
    stats = bar_data(p_air,p[0],'all',p[1],stats)
    all_data = weeks_years(all_data,p_air,p[0],'all','air')

    #repeat for individual stations if data exists
    for s in stations:
        s_air = p_air[p_air['station']==s]
        if len(s_air) > 0:
            all_data = weeks_years(all_data,s_air,p[0],s,'air')
            stats = bar_data(p_air,p[0],s,p[1],stats)

#repeat for weather and parking data
#can apply to any dataset with values and datetime fields for 2015/2016
all_data = weeks_years(all_data,weather,'wspdm','all','weather')
all_data = weeks_years(all_data,parking,'Percentage','all','parking')

#export to data files
all_data.to_csv('all_data.csv',index=False)
stats.to_csv('stats.csv',index=False)
