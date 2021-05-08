
import boto3
from decimal import Decimal


def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('Game')

    best_name, best_score = event['name'], event['score']

    table.update_item(
        Key={
            'gameId': 'record',
        },
        UpdateExpression="set score=:s, player=:p",
        ExpressionAttributeValues={
            ':s': Decimal(best_score),
            ':p': best_name
        },
        ReturnValues="UPDATED_NEW")
    # TODO: add exception handling
    return True
