
import { parse as callbackParse } from 'csv-parse';





// wrap csv-parse in a promise
function parse(textContent, params) {
  return new Promise((resolve, reject) => {
    callbackParse(textContent, params, (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
  
}






/*
csv datasets:
for city {
  current pop
  current area
  current density = pop/area
}
for city {
  for year {
    pop
    growth
  }
}
*/


// interface Data {
//     [cityName: string]: {
//         area: Number,
//         lat: Number,
//         long: Number
//         population: Number[],
//     }
// }

// hardcoded to test out the graph

const fakeData = {
    // newYork[1].population
    newYork: {
        lat: 4,
        long: 8,
        area: 400,
        populationOverTime: [
            1000_000,
            1000_001,
        ],
    },
    
    LA: {
        lat: 1,
        long: 2,
        area: 300,
        populationOverTime: [
            100_000,
            200_000,
        ],
    },
}




const citiesPopCsvs = [
  'data/populationOverTime/Atlanta-population-2024-05-09.csv',
  'data/populationOverTime/Boston-population-2024-05-09.csv',
  'data/populationOverTime/Chicago-population-2024-05-06.csv',
  'data/populationOverTime/Dallas-Fort Worth-population-2024-05-06.csv',
  'data/populationOverTime/Detroit-population-2024-05-09.csv',
  'data/populationOverTime/Houston-population-2024-05-06.csv',
  'data/populationOverTime/Los Angeles-population-2024-05-06.csv',
  'data/populationOverTime/Miami-population-2024-05-09.csv',
  'data/populationOverTime/Minneapolis-population-2024-05-09.csv',
  'data/populationOverTime/New York-population-2024-05-06.csv',
  'data/populationOverTime/Philadelphia-population-2024-05-09.csv',
  'data/populationOverTime/Phoenix-population-2024-05-09.csv',
  'data/populationOverTime/San Diego-population-2024-05-09.csv',
  'data/populationOverTime/San Francisco-population-2024-05-09.csv',
  'data/populationOverTime/Seattle-population-2024-05-09.csv',
  'data/populationOverTime/Washington DC-population-2024-05-09.csv',
  'data/populationOverTime/Tampa-population-2024-05-14.csv',
  'data/populationOverTime/St. Louis-population-2024-05-14.csv',
  'data/populationOverTime/San Jose-population-2024-05-14.csv',
  'data/populationOverTime/San Antonio-population-2024-05-14.csv',
  'data/populationOverTime/Sacramento-population-2024-05-14.csv',
  'data/populationOverTime/Riverside-population-2024-05-14.csv',
  'data/populationOverTime/Portland-population-2024-05-14.csv',
  'data/populationOverTime/Orlando-population-2024-05-14.csv',
  'data/populationOverTime/Las Vegas-population-2024-05-14.csv',
  'data/populationOverTime/Houston-population-2024-05-06.csv',
  'data/populationOverTime/Charlotte-population-2024-05-14.csv',
  'data/populationOverTime/Boston-population-2024-05-09.csv',
  'data/populationOverTime/Baltimore-population-2024-05-14.csv',
  'data/populationOverTime/Austin-population-2024-05-14.csv',

]
const citiesAreasCsvUrl = 'data/cityAreas.csv'
const latlongCitiesCsvUrl = 'data/uscities.csv'



export const data = {}



// get a promise saying when the population parsing is done, so area parsing can be after
  const populationsParsed = citiesPopCsvs.map(url => {
  const cityName = url.split('/')[2].split('-')[0]
  
  return fetch(url).then(r => r.text()).then(contents => parse(contents, {
      comment: '#'
    }).then((rows) => {
      // rows[0] is header
      
      const firstYear = Number(rows[1][0].split('-')[0])
      if (firstYear !== 1950) {
        alert('bad data')
      }
      
      const populationOverTime = rows.map(row => Number(row[1]))
      // remove header line
      populationOverTime.shift()
      
      data[cityName] = {
        populationOverTime,
        // area
        // lat long
      }
    })
  )
})


// when all pop data are parsed (every city has a record in data),
const areaParsed = Promise.all(populationsParsed).then(() => {
  return fetch(citiesAreasCsvUrl).then(r => r.text()).then(contents => parse(contents, {
      comment: '#',
      delimiter: '\t',
    }).then((areaDataRows) => {
      // remember on what line each city name is
      const areaDataNamesIdxs = new Map()
      areaDataRows.forEach((row, index) => {
        const cityName = row[0].split(',')[0]
        // when two names are the same, prioritize the bigger city (comes first in the file)
        if (!areaDataNamesIdxs.has(cityName)) {
          areaDataNamesIdxs.set(cityName, index)
        }
      })
      
      for (const name of Object.keys(data)) {
        if (areaDataNamesIdxs.has(name)) {
          // we have area for this city
          data[name].area = Number(areaDataRows[areaDataNamesIdxs.get(name)][3])
        }
        else {
          // no area for this city; we should remove from population data
          delete data[name]
        }
      }
    })
  )
})

// // when all pop data are parsed (every city has a record in data),
// const latlongParsed = Promise.all(populationsParsed)
const latLongParsed = areaParsed.then(() => {
    return fetch(latlongCitiesCsvUrl).then(r => r.text()).then(contents => parse(contents, {
        comment: '#',
        delimiter: ',',
      }).then((latlongDataRows) => {
        // remember on what line each city name is
        const latlongDataNamesIdxs = new Map()
        latlongDataRows.forEach((row, index) => {
          const cityName = row[0].split(',')[0]
          // when two names are the same, prioritize the bigger city (comes first in the file)
          if (!latlongDataNamesIdxs.has(cityName)) {
            latlongDataNamesIdxs.set(cityName, index)
          }
        })
        
        for (const name of Object.keys(data)) {
          if (latlongDataNamesIdxs.has(name)) {
            // we have latlong for this city
            // console.log("Adding lat and long");
            data[name].lat = Number(latlongDataRows[latlongDataNamesIdxs.get(name)][6])
            data[name].long = Number(latlongDataRows[latlongDataNamesIdxs.get(name)][7])
          }
          else {
            // no latlong for this city; we should remove from population data
            delete data[name]
          }
        }
      })
    )
})



export const dataReady = latLongParsed


dataReady.then(() => {
  console.log(data)
})

// dataReady2.then(() => {
//     console.log(data)
//   })

// loop through uscities.csv one line at a time.
// See if the city is in your "data" object.
// If so, parse the line for lat/lon
// Add those qualities to the corresponding city object in data



