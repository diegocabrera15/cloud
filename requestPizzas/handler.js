"use strict";

const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.REGION });
var sqs = new AWS.SQS({ apiVersion: "2021-10-17" });
const QUEUE_URL = process.env.PENDING_ORDER_QUEUE;
const orderMetadataManager = require('./orderMetadataManager');

module.exports.hacerPedido = async (event) => {
  console.log("Hacer pedido fue llamada");
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
  const order = JSON.parse(event.Records[0].body);

	const sqsResponse = await orderMetadataManager
		.saveCompleteOrder(order)
		.then(data => {
			console.log("data", data);
		})
		.catch(err => {
			console.log("err", err);
		});
};

module.exports.enviarPedido = async (event) => {
  console.log('Llama a enviarPedido');
  const record = event.Records[0];
	if (record.eventName === 'INSERT') {
		console.log('deliverOrder');

		const orderId = record.dynamodb.Keys.orderId.S;

		const sqsResponse = await orderMetadataManager
			.deliverOrder(orderId)
			.then(data => {
				console.log("data", data);
			})
			.catch(err => {
				console.log("err", err);
			});
	} else {
		console.log('is not a new record');
	}
};

module.exports.estadoPedido = async (event) => {
	console.log('Estado pedido fue llamado');
  console.log('Estado pedido fue llamado event', event);
	const orderId = event.pathParameters && event.pathParameters.orderId;
  console.log('Estado pedido fue llamado orderId', orderId);
	if (orderId !== null) {
		const respOrder = await orderMetadataManager
			.getOrder(orderId)
			.then(order => {      
        const dataResponse = {
          orderId: order.orderId,
          status: order.delivery_status,
          name: order.name
        }
        return dataResponse;
				
			})
			.catch(error => {
				console.log(500, 'Hubo un error al procesar el pedido',error);
			});

      if(respOrder !=null){
        console.log(200, `El estado de la orden ${respOrder}`);
        return responseWs(200, `El estado de la orden: ${respOrder.name} y  ${respOrder.orderId} es ${respOrder.status}`);
      }else{
        return responseWs(500, 'Hubo un error al procesar el pedido');
      }
	} else {
		return responseWs(400, 'Falta el orderId');
	}
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