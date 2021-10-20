'use strict';

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({region: "us-east-1"});

module.exports.saveCompleteOrder = order =>{
    console.log('Guardar pedido fue llamado');
   
    order.delivery_status = "READY_FOR_DELIVERY"
    console.log('Guardar pedido order', order);
    const params = {
        TableName: process.env.COMPLETE_ORDER_TABLE,
        Item: order
    };
    console.log('Fin de guardado!');
    return dynamodb.put(params).promise();    
};

module.exports.deliverOrder = orderId => {
	console.log('Enviar una orden fue llamado');

	const params = {
		TableName: process.env.COMPLETE_ORDER_TABLE,
		Key: {
			orderId
		},
		ConditionExpression: 'attribute_exists(orderId)',
		UpdateExpression: 'set delivery_status = :v',
		ExpressionAttributeValues: {
			':v': 'DELIVERED'
		},
		ReturnValues: 'ALL_NEW'
	};

	return dynamodb
		.update(params)
		.promise()
		.then(response => {
			console.log('order delivered');
			return response.Attributes;
		});
};

module.exports.getOrder = orderId => {
	console.log('El metodo obtener una orden fue llamado');
	console.log('El metodo obtener una orden fue llamado orderId',orderId);

	const params = {
		TableName: process.env.COMPLETE_ORDER_TABLE,
		Key: {
			orderId
		}
	};

	return dynamodb
		.get(params)
		.promise()
		.then(item => {
            console.log("getOrder Item",item.Item);
			return item.Item;
		});
};