import { useState, useEffect, useCallback } from "react";

const authorizationKey = "CWA-4BCC983B-D929-4F9D-AD92-25CEBB3BB05A";

const fetchCurrentWeather = (locationName) => {
  // console.log(locationName);
  // STEP 3-1：加上 return 直接把 fetch API 回傳的 Promise 回傳出去
  return fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=${authorizationKey}&locationName=臺北`)
    .then((response) => response.json())
    .then((data) => {
      const locationData = data.records.Station[2];
      // 將風速（WDSD）、氣溫（TEMP）和濕度（HUMD）的資料取出
      const weatherElements = {
        WindSpeed: locationData.WeatherElement.WindSpeed,
        AirTemperature: locationData.WeatherElement.AirTemperature,
        RelativeHumidity: locationData.WeatherElement.RelativeHumidity,
      };
      // STEP 3-2：把取得的資料內容回傳出去，而不是在這裡 setWeatherElement
      return {
        observationTime: locationData.ObsTime.DateTime,
        locationName: locationData.StationName,
        temperature: weatherElements.AirTemperature,
        windSpeed: weatherElements.WindSpeed,
        humid: weatherElements.RelativeHumidity,
      };
    });
};

// const fetchWeatherForecast = (cityName) => {
//   return fetch(
//     `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${authorizationKey}&locationName=臺北`
//   )
//     .then((response) => response.json())
//     .then((data) => {
//       console.log(data)
//       const locationData = data.records.location[1];
//       console.log(locationData);
//       const weatherElements = locationData.WeatherElement.reduce(
//         (neededElements, item) => {
//           if (["Wx", "PoP", "CI"].includes(item.elementName)) {
//             neededElements[item.elementName] = item.time[0].parameter;
//           }
//           return neededElements;
//         },
//         {}
//       );
//       // console.log(weatherElements);
//       return {
//         description: weatherElements.Wx.parameterName,
//         weatherCode: weatherElements.Wx.parameterValue,
//         rainPossibility: weatherElements.PoP.parameterName,
//         comfortability: weatherElements.CI.parameterName,
//       };
//     });
// };

// STEP 4：定義 fetchWeatherForecast 方法，這個方法會取得未來 36 小時的天氣資訊
const fetchWeatherForecast = async (cityName) => {
  try {
    const response = await fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${authorizationKey}&locationName=臺北`);
    const data = await response.json();
    // console.log(data);
    const locationData = data.records.location[1];
    // console.log(locationData);
    const weatherElements = locationData?.WeatherElement?.reduce((neededElements, item) => {
      if (["Wx", "PoP", "CI"].includes(item.elementName)) {
        neededElements[item.elementName] = item.time[0].parameter;
      }
      return neededElements;
    }, {});
    // console.log(weatherElements);
    return {
      description: weatherElements?.Wx?.parameterName,
      weatherCode: weatherElements?.Wx?.parameterValue,
      rainPossibility: weatherElements?.PoP?.parameterName,
      comfortability: weatherElements?.CI?.parameterName,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

const useWeatherApi = (currentLocation) => {
  const { locationName, cityName } = currentLocation;
  const [weatherElement, setWeatherElement] = useState({
    observationTime: new Date(),
    locationName: "",
    description: "",
    temperature: 0,
    windSpeed: 0,
    humid: 0,
    weatherCode: 0,
    rainPossibility: 0,
    comfortability: "",
    isLoading: true,
  });

  // 如果某個函式不需要被覆用，那麼可以直接定義在 useEffect 中，但若該方法會需要被共用，則把該方法提到 useEffect 外面後，記得用 useCallback 進行處理後再放到 useEffect 的 dependencies 中
  // 使用 useCallback 並將回傳的函式取名為 fetchData
  const fetchData = useCallback(() => {
    setWeatherElement((prevState) => ({
      ...prevState,
      isLoading: true,
    }));
    const fetchingData = async () => {
      const [currentWeather, weatherForecast] = await Promise.all([fetchCurrentWeather(), fetchWeatherForecast()]);
      // 把取得的資料透過物件的解構賦值放入
      setWeatherElement({
        ...currentWeather,
        ...weatherForecast,
        isLoading: false,
      });
    };
    // 一樣記得要呼叫 fetchingData 這個方法
    // 因為 fetchingData 沒有相依到 React 組件中的資料狀態，所以 dependencies 帶入空陣列
    fetchingData();
  }, []);

  // 把透過 useCallback 回傳的函式放到 useEffect 的 dependencies 中
  // }, [fetchData]);
  useEffect(() => {
    fetchData();
    // 把透過 useCallback 回傳的函式放到 useEffect 的 dependencies 中
  }, [fetchData]);

  return [weatherElement, fetchData];
};

export default useWeatherApi;
