<?php


namespace VanguardLTE\Games\Bookofradeluxe6GT;

use VanguardLTE\Games\GreentubeFunctions\CommandsHandler;
use VanguardLTE\Game;
use VanguardLTE\Games\GreentubeLib\GameSettings;
use VanguardLTE\Shop;
use VanguardLTE\User;

set_time_limit(10);
class Server
{
    public function get($request, $gameName)
    {
        //проверка авторизации
        $userId = \Auth::id();
        if( $userId == null )
        {
            $response = '{"responseEvent":"error","responseType":"","serverResponse":"invalid login"}';
            exit( $response );
        }

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        $user = User::lockForUpdate()->find($userId);
        $shop = Shop::find($user->shop_id);
        $game = Game::where([
            'name' => $gameName,
            'shop_id' => $user->shop_id
        ])->lockForUpdate()->first();
        $init = require 'init.php';
        $settings = require 'settings.php';
        $gameSettings = new GameSettings($init, false);

        //получаем в переменную что пришло из POST
        $postData = json_decode(trim(file_get_contents('php://input')), true);

        if ($postData['Multiplier'] == 10) {
            $gameSettings->extraBet = true;
        }

        
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        $response = 'Error. Not found response';
       
        $response = CommandsHandler::result($postData,$init,$settings,$user,$game,$gameSettings);
        echo $response;
    }
}