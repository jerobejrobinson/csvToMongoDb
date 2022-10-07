const csvtojson = require("csvtojson");
const fs = require('fs')
const { MongoClient } = require("mongodb")
require("dotenv").config()

// setup client
const client = new MongoClient(process.env.MONGODB_URI)

/**
 * @param {array} arr needs to be a json array
 * @param {string} db name of database to connect too
 * @param {string} collection name of collection to get
 */
async function addData(arr, db, collection) {
    // open client
    await client.connect();

    const database = client.db(db)

    const coll = database.collection(collection)

    await coll.insertMany(arr)

    await client.close()
}

async function checkDB(arr, db, coll) {
    await client.connect();
    const database = await client.db(db);
    const collection = await database.collection(coll)

    // console.log(collection)
    let filter = await Promise.all(arr.map(async obj => {
        return await new Promise(async (resolve, reject) => {
            let location = await collection.findOne({customerNumber: obj.customerNumber})
            if(!location) {
                resolve(obj)
            } else {
                reject(obj.customerNumber)
            }
        }).then(data => data).catch(error => {
            return {customerNumber: error, found: true}
        })
    }))

    fs.writeFileSync('data/10-07-2022/add-list.json', JSON.stringify(filter.filter(obj => obj.found == true ? 0 : 1)))

    await client.close()
}
// async function addAndModifyData(arr, db, arrColl, collection = 'locations') {
//     await client.connect();

//     const database = client.db(db)

//     const locations = await database.collection(collection).find({}).toArray();

//     const newArr = []

//     locations.map(location => {
//         arr.map(user => {
//             if(user.customerNumber != location.customerNumber) {
//                 return;
//             }
//             user.locationID = location._id
//             newArr.push(user)
//         })
//     })

//     const coll = database.collection(arrColl)
    
//     return await coll.insertMany(newArr)
// }



csvtojson()
.fromFile("data/10-07-2022/open.csv")
.then(csvData => {
    let dealers = csvData.map(i => {
            return {
                customerNumber: i["Cust #"], 
                customer: i["Customer"],
                phone: i["Phone #"],
                address: i["Address"],
                city: i["City"],
                state: i["State"],
                zip: i["Zip"],
                country: i["Cnty"],
            }
        })
    checkDB(dealers, 'accounts', 'locations')
    // addAndModifyData(dealers, 'accounts', 'dealerEmails').then(console.log()).catch(console.error()).finally(() => client.close())
    // fs.writeFileSync('9_30_2022v2.json', JSON.stringify(dealers))
    // console.log(data.length)
})
