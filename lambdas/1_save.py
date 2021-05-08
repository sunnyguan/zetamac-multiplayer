import json
import boto3
from decimal import Decimal


def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('Game')
    table.put_item(Item=event)
    # TODO: error checking with response from put_item
    return event
