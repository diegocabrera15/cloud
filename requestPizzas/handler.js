"use strict";

const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.REGION });
var sqs = new AWS.SQS({ apiVersion: "2021-10-17" });
const QUEUE_URL = process.env.PENDING_ORDER_QUEUE;
const orderMetadataManager = require('./orderMetadataManager');

module.exports.hacerPedido = async (event) => {
  console.log("Hacer pedido fue llamada");
  console.log("Event", event);
  const orderId = uuidv4();

  const body = JSON.parse(event.body);

	const order = {
		orderId: orderId,
		name: body.name,
		address: body.address,
		pizzas: body.pizzas,
		timestamp: Date.now()
	};


  const params = {
    DelaySeconds: 10,
    MessageBody: JSON.stringify(order),
    QueueUrl: QUEUE_URL,
  };


  const sqsResponse = await sqs.sendMessage(params).promise()
  .then((data) => {
      const message = {
        orderId: orderId,
        messageId: data.MessageId
      };    
      return message;
  })
  .catch((error)=>{
    console.log("Error in SQS: ", error)
  });
  
  if(sqsResponse != null){
    return responseWs(200, sqsResponse)

  }else{
    return responseWs(500, "Error al consultar SQS");
  }
  
};

module.exports.prepararPedido = async (event) => {
  console.log("prepararPedido fue llamada");

  // const order = JSON.parse(event.Records[0].body);
  // orderMetadataManager.saveCompleteOrder(order)
  //                     .then(data =>{
  //                       console.log("data", data);
  //                       // return data;
  //                     })
  //                     .catch(err =>{
  //                       console.log("err", err);
  //                     });
  const order = JSON.parse(event.Records[0].body);

	const sqsResponse = await orderMetadataManager
		.saveCompleteOrder(order)
		.then(data => {
			console.log("data", data);
		})
		.catch(error => {
			console.log("err", err);
		});
};

const responseWs = (statusCode, message) =>{
  return {
    statusCode: statusCode,
    body: JSON.stringify(
      {
        message: message,
      },
      null,
      2
    ),
  };  
}