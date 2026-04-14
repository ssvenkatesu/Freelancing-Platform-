import Navbar from "./components/navbar/Navbar"
import React from "react"
import Home from "./pages/home/Home"
import Gigs from "./pages/gigs/Gigs"
import Gig from "./pages/gig/Gig"
import Add from "./pages/add/Add"
import Orders from "./pages/orders/Orders"
import Message from "./pages/message/Message"
import Messages from "./pages/messages/Messages"
import MyGigs from "./pages/myGigs/MyGigs"
import Samplepay from "./pages/samplepay/samplepay"
import Login from "./pages/login/Login"
import { createBrowserRouter,RouterProvider,Outlet } from "react-router-dom"
import Footer from "./components/footer/Footer"
import "./App.scss"
import Register from "./pages/register/Register"

function App() {

    const Layout = ()=>{
      return (
        <>
        <div className="app">
        <Navbar/>
        <Outlet/>
        <Footer/>
        </div>
        </>
      )
    }

    const router = createBrowserRouter([
      {
        path: "/",  
        element: <Layout/>,
        children:[
          {
            path:"/",
            element:<Home />
          },
          {
            path:"/gigs",
            element:<Gigs />
          },
          {
            path:"/gig/:id",
            element:<Gig />
          },
          {
            path:"/orders",
            element:<Orders />
          },
          {
            path:"/mygigs",
            element:<MyGigs />
          },
          {
            path:"/add",
            element:<Add />
          },
          {
            path:"/messages",
            element:<Messages />
          },
          {
            path:"/message/:id",
            element:<Message />
          },
          {
            path: "/samplepay/:gigId",
            element: <Samplepay />,
          },
          {
            path: "/login",  // Add the SamplePay route here
            element: <Login />,
          },
          {
            path: "/register",  // Add the SamplePay route here
            element: <Register />,
          }
        ]
      }
    ])


  return (
    <>
    <div>
      <RouterProvider router={router} />
    </div>
    </>
  )
}

export default App
