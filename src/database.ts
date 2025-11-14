import * as dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

//const URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@clusterservineo.yotr2ip.mongodb.net/ServineoBD?retryWrites=true&w=majority&appName=ClusterServineo`;

function _connect() {
  const URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@clusterservineo.yotr2ip.mongodb.net/ServineoBD?retryWrites=true&w=majority&appName=ClusterServineo`;
  //const URI = `mongodb://${process.env.MONGO_HOST}/${process.env.MONGO_DB}`;
  //const URI = `mongodb://localhost:27017/Prueba`;
  mongoose.connect(URI).then(
    () => {
      console.log('Connection Successful.');
    },
    (err) => {
      console.error('Connection Error: ', err);
    },
  );
}

export default _connect;
