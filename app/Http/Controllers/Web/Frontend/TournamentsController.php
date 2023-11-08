<?php

namespace VanguardLTE\Http\Controllers\Web\Frontend {
    include_once(base_path() . '/app/ShopCore.php');
    include_once(base_path() . '/app/ShopGame.php');
    class TournamentsController extends \VanguardLTE\Http\Controllers\Controller
    {
        public function __construct()
        {
            $this->middleware('auth');
        }
        public function index(\Illuminate\Http\Request $request)
        {
            if (\Illuminate\Support\Facades\Auth::check() && !auth()->user()->hasRole('user')) {
                return redirect()->route('backend.dashboard');
            }
            if (!\Illuminate\Support\Facades\Auth::check()) {
                return redirect()->route('frontend.auth.login');
            }
            $shop_id = (\Illuminate\Support\Facades\Auth::check() ? auth()->user()->shop_id : 0);
            $shop = \VanguardLTE\Shop::find($shop_id);
            $currentSliderNum = -1;
            $category1 = '';
            $frontend = settings('frontend');
            if ($shop_id && $shop) {
                $frontend = $shop->frontend;
            }
            $games = \VanguardLTE\Game::where([
                'view' => 1,
                'shop_id' => $shop_id
            ]);
            $detect = new \Detection\MobileDetect();
            if ($detect->isMobile() || $detect->isTablet()) {
                $games = $games->whereIn('device', [
                    0,
                    2
                ]);
            } else {
                $games = $games->whereIn('device', [
                    1,
                    2
                ]);
            }
            $games = $games->get();
            $categories = false;
            if ($games) {
                $cat_ids = \VanguardLTE\GameCategory::whereIn('game_id', \VanguardLTE\Game::where([
                    'view' => 1,
                    'shop_id' => $shop_id
                ])->pluck('original_id'))->groupBy('category_id')->pluck('category_id');
                if (count($cat_ids)) {
                    $categories = \VanguardLTE\Category::whereIn('id', $cat_ids)->orderBy('position', 'ASC')->get();
                }
            }
            // $tournament = \VanguardLTE\Tournament::where('shop_id', $shop_id)->where('start', '<=', \Carbon\Carbon::now())->where('end', '>=', \Carbon\Carbon::now())->orderBy('end', 'ASC')->get();

            $tournament = \VanguardLTE\Tournament::where('shop_id', $shop_id)->where(function ($query) {
                $query->where('start', '<', \Carbon\Carbon::now())->where('end', '>', \Carbon\Carbon::now());
            })->orWhere(function ($query) {
                $query->where('start', '>', \Carbon\Carbon::now());
            })->orderBy('start', 'ASC')->get();

            if (!$tournament) {
                $tournament = \VanguardLTE\Tournament::where('shop_id', $shop_id)->where('start', '>=', \Carbon\Carbon::now())->where('end', '>=', \Carbon\Carbon::now())->orderBy('end', 'ASC')->get();
            }
            $activeTake = 5;
            if ($tournament) {
                $activeTake = 4;
            }
            $activeTournaments = \VanguardLTE\Tournament::where([
                'shop_id' => $shop_id,
                'status' => 'active'
            ]);
            if ($tournament) {
                $activeTournaments->whereIn('id', \VanguardLTE\Tournament::where('shop_id', $shop_id)->where('start', '<=', \Carbon\Carbon::now())->where('end', '>=', \Carbon\Carbon::now())->pluck('id'));
            }
            $activeTournaments = $activeTournaments->orderBy('end', 'ASC')->take($activeTake)->get();
            $waitingTournaments = \VanguardLTE\Tournament::where([
                'shop_id' => $shop_id,
                'status' => 'waiting'
            ]);
            if ($tournament) {
                $waitingTournaments->whereIn('id', \VanguardLTE\Tournament::where('shop_id', $shop_id)->where('start', '<', \Carbon\Carbon::now())->pluck('id'));
            }
            $waitingTournaments = $waitingTournaments->orderBy('start', 'ASC')->take(4)->get();
            $completedTournaments = \VanguardLTE\Tournament::where([
                'shop_id' => $shop_id,
                'status' => 'completed'
            ]);
            if ($tournament) {
                $completedTournaments->whereIn('id', \VanguardLTE\Tournament::where('shop_id', $shop_id)->where('end', '<=', \Carbon\Carbon::now())->pluck('id'));
            }
            $completedTournaments = $completedTournaments->orderBy('end', 'ASC')->take(4)->get();
            $newTournament = array();
            $tournament = $tournament->toarray();
            for ($i = 0; $i < count($tournament); $i++) {
                foreach ($tournament[$i] as $key => $item) {
                    $newTournament[$i][$key] = $item;
                }
                $newTournament[$i]['games'] = \VanguardLTE\TournamentGame::where('tournament_id', '=', $tournament[$i]['id'])->get();
            };
            $tournament = $newTournament;
            return view('frontend.' . $frontend . '.tournaments.list', compact('activeTournaments', 'waitingTournaments', 'completedTournaments', 'tournament', 'categories', 'currentSliderNum', 'category1'));
        }

        public function view(\Illuminate\Http\Request $request, \VanguardLTE\Tournament $tournament)
        {
            $shop_id = (\Illuminate\Support\Facades\Auth::check() ? auth()->user()->shop_id : 0);
            $shop = \VanguardLTE\Shop::find($shop_id);
            $currentSliderNum = -1;
            $category1 = '';
            $frontend = settings('frontend');
            if ($shop_id && $shop) {
                $frontend = $shop->frontend;
            }
            $games = \VanguardLTE\Game::where([
                'view' => 1,
                'shop_id' => $shop_id
            ]);
            $detect = new \Detection\MobileDetect();
            if ($detect->isMobile() || $detect->isTablet()) {
                $games = $games->whereIn('device', [
                    0,
                    2
                ]);
            } else {
                $games = $games->whereIn('device', [
                    1,
                    2
                ]);
            }
            $games = $games->get();
            $categories = false;
            if ($games) {
                $cat_ids = \VanguardLTE\GameCategory::whereIn('game_id', \VanguardLTE\Game::where([
                    'view' => 1,
                    'shop_id' => $shop_id
                ])->pluck('original_id'))->groupBy('category_id')->pluck('category_id');
                if (count($cat_ids)) {
                    $categories = \VanguardLTE\Category::whereIn('id', $cat_ids)->orderBy('position', 'ASC')->get();
                }
            }
            return view('frontend.' . $frontend . '.tournaments.view', compact('tournament', 'categories', 'currentSliderNum', 'category1'));
        }

        public function order(\Illuminate\Http\Request $request)
        {
            $tournamentId = $request->id;
            $orders = \VanguardLTE\TournamentStat::where('tournament_id', $tournamentId)->orderBy('sum_of_wins', 'DESC')->limit(10)->get();
            echo json_encode($orders);
        }

        public function countResult(\Illuminate\Http\Request $request)
        {
            $tournamentId = $request->id;
            $prize = \VanguardLTE\TournamentPrize::where('tournament_id', $tournamentId)->orderBy('prize', 'DESC')->get()->toarray();
            $orders = \VanguardLTE\TournamentStat::where('tournament_id', $tournamentId)->where('state', '0')->orderBy('sum_of_wins', 'DESC')->get();
            if (count($orders) > 0) {
                for ($i = 0; $i < count($orders); $i++) {
                    $currentUser = \VanguardLTE\User::where('id', $orders[$i]->user_id)->first();
                    \VanguardLTE\User::where('id', $orders[$i]->user_id)->update(['balance' => ($currentUser->balance + $prize[$i]['prize'])]);
                }
                \VanguardLTE\TournamentStat::where('tournament_id', $tournamentId)->update(['state' => '1']);
            }
            return true;
        }

        public function getUserBalance(\Illuminate\Http\Request $request)
        {
            return \VanguardLTE\User::where('id', $request->id)->first();
        }

        public function security()
        {
        }
    }
}
