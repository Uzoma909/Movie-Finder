import React, {useEffect, useState} from 'react'
import Search from "./components/Search.jsx";
import error from "eslint-plugin-react/lib/util/error.js";
import Spinner from "./components/Spinner.jsx";
import MovieCard from './components/MovieCard.jsx';
import {useDebounce} from 'react-use'
import {getTrendingMovies, updateSearchCount} from "./appwrite.js";

const API_BASE_URL = "https://api.themoviedb.org/3/";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
    method: "GET",
    headers: {
        accept: "application/json",
        Authorization: `Bearer ${API_KEY}`,
    }
}

const App = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [movieList, setMovieList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [debouncedSearchTerm, setDebounceSearchTerm] = useState('');
    const [trendingMovies, setTrendingMovies] = useState([]);

    useDebounce( () => setDebounceSearchTerm(searchTerm), 600, [searchTerm])

    const fetchMovies = async (query = '')=> {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const endpoint = query
                ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
                : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

            const response = await fetch(endpoint, API_OPTIONS);

            if (!response.ok) {
                throw new Error('Could not fetch movies');
            }

            const data = await response.json();

            console.log(data);
            if(data.Response === 'false') {
                setErrorMessage(data.Error || 'Failed to fetch movies');
                setMovieList([]);
                return;
            }

            setMovieList(data.results || []);

            if(query && data.results.length > 0) {
                await updateSearchCount(query, data.results[0]);
            }
        } catch (error) {
            console.log(`Error fetching movies: ${error}`);
            setErrorMessage('Error fetching movies. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    const loadTrendingMovies = async () => {
        try {
            const movies = await getTrendingMovies();

            setTrendingMovies(movies);
        } catch (error) {
            console.error(`Error fetching trending movies: ${error}`);
        }
    }

    useEffect(() => {
        fetchMovies(debouncedSearchTerm);
    },[debouncedSearchTerm]);

    useEffect(() => {
        loadTrendingMovies();
    }, []);

    return (
        <main>

            <div className="pattern"/>
            <div className="wrapper">
                <header>
                    <img src="./hero-img.png" alt="Hero Banner" />
                    <h1>The <span className="animate-text-gradient bg-radial-[circle_at_center] from-[#A6C6F5] to-[#024eb9] to-[0] bg-[length:300%] bg-clip-text text-transparent">Movies</span> You'll Enjoy Without the <span className="animate-text-gradient bg-radial-[circle_at_center] from-[#FFF3B8] to-[#EDCA1A] bg-[length:200%] bg-clip-text text-transparent">Hassle</span></h1>

                    <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </header>

                {trendingMovies.length > 0 && (
                    <section className="trending">
                        <h2>Trending Movies</h2>

                        <ul>
                            {trendingMovies.map((movie, index) => (
                                <li key={movie.$id}>
                                    <p>{index + 1}</p>
                                    <img src={movie.poster_url} alt={movie.title} />
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section className="all-movies">
                    <h2>All Movies</h2>

                    {isLoading ? (
                        <Spinner/>
                    ) : errorMessage ? (
                        <p className="text-red-400">{errorMessage}</p>
                    ) : (
                        <ul>
                            {movieList.map((movie) => (
                                <MovieCard key={movie.id} movie={movie}/>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    )
}

export default App
