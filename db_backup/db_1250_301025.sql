--
-- PostgreSQL database dump
--

-- Dumped from database version 14.15
-- Dumped by pg_dump version 14.15

-- Started on 2025-10-30 12:50:18 +05

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 855 (class 1247 OID 40523)
-- Name: order_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'assigned',
    'in_transit',
    'delivered',
    'cancelled'
);


ALTER TYPE public.order_status OWNER TO postgres;

--
-- TOC entry 221 (class 1255 OID 40519)
-- Name: update_orders_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_orders_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_orders_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 214 (class 1259 OID 40430)
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    user_id integer NOT NULL,
    company_name character varying(150)
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 40450)
-- Name: dispatchers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dispatchers (
    user_id integer NOT NULL
);


ALTER TABLE public.dispatchers OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 40440)
-- Name: drivers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drivers (
    user_id integer NOT NULL,
    license_number character varying(50) NOT NULL
);


ALTER TABLE public.drivers OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 40534)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    order_id integer NOT NULL,
    client_id integer NOT NULL,
    dispatcher_id integer NOT NULL,
    driver_id integer NOT NULL,
    vehicle_id integer NOT NULL,
    origin character varying(255) NOT NULL,
    destination character varying(255) NOT NULL,
    cargo_description text,
    weight_kg integer,
    price numeric(10,2) NOT NULL,
    status public.order_status DEFAULT 'pending'::public.order_status,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    delivery_date date,
    CONSTRAINT orders_price_check CHECK ((price > (0)::numeric)),
    CONSTRAINT orders_weight_kg_check CHECK ((weight_kg > 0))
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 40533)
-- Name: orders_order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.orders_order_id_seq OWNER TO postgres;

--
-- TOC entry 4042 (class 0 OID 0)
-- Dependencies: 219
-- Name: orders_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_order_id_seq OWNED BY public.orders.order_id;


--
-- TOC entry 210 (class 1259 OID 40395)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    role_name character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 209 (class 1259 OID 40394)
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roles_role_id_seq OWNER TO postgres;

--
-- TOC entry 4043 (class 0 OID 0)
-- Dependencies: 209
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- TOC entry 213 (class 1259 OID 40415)
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    user_id integer NOT NULL,
    role_id integer NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- TOC entry 212 (class 1259 OID 40404)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    last_name character varying(100) NOT NULL,
    first_name character varying(100) NOT NULL,
    middle_name character varying(100),
    phone character varying(20),
    email character varying(150),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 211 (class 1259 OID 40403)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 4044 (class 0 OID 0)
-- Dependencies: 211
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 218 (class 1259 OID 40461)
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicles (
    vehicle_id integer NOT NULL,
    plate_number character varying(20) NOT NULL,
    model character varying(100) NOT NULL,
    capacity_kg integer NOT NULL,
    status character varying(50) DEFAULT 'available'::character varying,
    CONSTRAINT vehicles_capacity_kg_check CHECK ((capacity_kg > 0))
);


ALTER TABLE public.vehicles OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 40460)
-- Name: vehicles_vehicle_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vehicles_vehicle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.vehicles_vehicle_id_seq OWNER TO postgres;

--
-- TOC entry 4045 (class 0 OID 0)
-- Dependencies: 217
-- Name: vehicles_vehicle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vehicles_vehicle_id_seq OWNED BY public.vehicles.vehicle_id;


--
-- TOC entry 3849 (class 2604 OID 40537)
-- Name: orders order_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN order_id SET DEFAULT nextval('public.orders_order_id_seq'::regclass);


--
-- TOC entry 3843 (class 2604 OID 40398)
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- TOC entry 3844 (class 2604 OID 40407)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 3846 (class 2604 OID 40464)
-- Name: vehicles vehicle_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles ALTER COLUMN vehicle_id SET DEFAULT nextval('public.vehicles_vehicle_id_seq'::regclass);


--
-- TOC entry 4030 (class 0 OID 40430)
-- Dependencies: 214
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (user_id, company_name) FROM stdin;
2	ООО БазовыйКлиент
5	\N
\.


--
-- TOC entry 4032 (class 0 OID 40450)
-- Dependencies: 216
-- Data for Name: dispatchers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dispatchers (user_id) FROM stdin;
4
\.


--
-- TOC entry 4031 (class 0 OID 40440)
-- Dependencies: 215
-- Data for Name: drivers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.drivers (user_id, license_number) FROM stdin;
3	LIC-BASE-0001
\.


--
-- TOC entry 4036 (class 0 OID 40534)
-- Dependencies: 220
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (order_id, client_id, dispatcher_id, driver_id, vehicle_id, origin, destination, cargo_description, weight_kg, price, status, created_at, updated_at, delivery_date) FROM stdin;
1	2	4	3	1	Москва, ул. Ленина, 10	Санкт-Петербург, Невский проспект, 25	Офисная мебель	1800	32000.00	pending	2025-10-30 12:47:40.354665	2025-10-30 12:47:40.354665	2025-11-04
2	2	4	3	2	Казань, ул. Техническая, 3	Нижний Новгород, проспект Гагарина, 88	Металлоконструкции	9500	85000.00	assigned	2025-10-30 12:47:40.395083	2025-10-30 12:47:40.395083	2025-11-06
3	2	4	3	1	Екатеринбург, ул. Заводская, 11	Пермь, ул. Комсомольская, 5	Бытовая техника	3200	42000.00	in_transit	2025-10-30 12:47:40.410948	2025-10-30 12:47:40.410948	2025-11-01
4	2	4	3	2	Новосибирск, ул. Рабочая, 2	Томск, пр. Ленина, 16	Продукты питания	7200	51000.00	delivered	2025-10-30 12:47:40.419177	2025-10-30 12:47:40.419177	2025-10-29
5	2	4	3	1	Воронеж, ул. 9 Января, 40	Ростов-на-Дону, ул. Будённовская, 12	Одежда и текстиль	2100	27000.00	cancelled	2025-10-30 12:47:40.426904	2025-10-30 12:47:40.426904	2025-11-02
\.


--
-- TOC entry 4026 (class 0 OID 40395)
-- Dependencies: 210
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (role_id, role_name) FROM stdin;
1	admin
2	client
3	driver
4	dispatcher
\.


--
-- TOC entry 4029 (class 0 OID 40415)
-- Dependencies: 213
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (user_id, role_id) FROM stdin;
1	1
2	2
3	3
4	4
5	2
\.


--
-- TOC entry 4028 (class 0 OID 40404)
-- Dependencies: 212
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, username, password_hash, last_name, first_name, middle_name, phone, email, created_at) FROM stdin;
5	user	$2y$10$JvngRGErxfsiQcihJhZv4O/OLwI/vkpMV1V2XayootiVRvy4o619q	Dedyuhin	Artem	\N	\N	\N	2025-10-30 12:35:26.754835
1	admin	$2y$10$JvngRGErxfsiQcihJhZv4O/OLwI/vkpMV1V2XayootiVRvy4o619q	Иванов	Иван	\N	+70000000001	admin@example.com	2025-10-30 12:34:05.007773
2	client_basic	$2y$10$JvngRGErxfsiQcihJhZv4O/OLwI/vkpMV1V2XayootiVRvy4o619q	Петров	Пётр	\N	+70000000002	client@example.com	2025-10-30 12:34:05.007773
3	driver_basic	$2y$10$JvngRGErxfsiQcihJhZv4O/OLwI/vkpMV1V2XayootiVRvy4o619q	Сидоров	Сидор	\N	+70000000003	driver@example.com	2025-10-30 12:34:05.007773
4	dispatcher_basic	$2y$10$JvngRGErxfsiQcihJhZv4O/OLwI/vkpMV1V2XayootiVRvy4o619q	Козлов	Козьма	\N	+70000000004	dispatcher@example.com	2025-10-30 12:34:05.007773
\.


--
-- TOC entry 4034 (class 0 OID 40461)
-- Dependencies: 218
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicles (vehicle_id, plate_number, model, capacity_kg, status) FROM stdin;
1	A100AA77	Газель Next	1500	available
2	B200BB77	MAN TGX	20000	available
\.


--
-- TOC entry 4046 (class 0 OID 0)
-- Dependencies: 219
-- Name: orders_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_order_id_seq', 5, true);


--
-- TOC entry 4047 (class 0 OID 0)
-- Dependencies: 209
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 4, true);


--
-- TOC entry 4048 (class 0 OID 0)
-- Dependencies: 211
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 5, true);


--
-- TOC entry 4049 (class 0 OID 0)
-- Dependencies: 217
-- Name: vehicles_vehicle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vehicles_vehicle_id_seq', 2, true);


--
-- TOC entry 3866 (class 2606 OID 40434)
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3870 (class 2606 OID 40454)
-- Name: dispatchers dispatchers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispatchers
    ADD CONSTRAINT dispatchers_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3868 (class 2606 OID 40444)
-- Name: drivers drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3876 (class 2606 OID 40546)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- TOC entry 3856 (class 2606 OID 40400)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 3858 (class 2606 OID 40402)
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- TOC entry 3864 (class 2606 OID 40419)
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- TOC entry 3860 (class 2606 OID 40412)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3862 (class 2606 OID 40414)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 3872 (class 2606 OID 40468)
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (vehicle_id);


--
-- TOC entry 3874 (class 2606 OID 40470)
-- Name: vehicles vehicles_plate_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_plate_number_key UNIQUE (plate_number);


--
-- TOC entry 3879 (class 2606 OID 40435)
-- Name: clients clients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3881 (class 2606 OID 40455)
-- Name: dispatchers dispatchers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispatchers
    ADD CONSTRAINT dispatchers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3880 (class 2606 OID 40445)
-- Name: drivers drivers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3882 (class 2606 OID 40547)
-- Name: orders orders_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(user_id) ON DELETE RESTRICT;


--
-- TOC entry 3883 (class 2606 OID 40552)
-- Name: orders orders_dispatcher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_dispatcher_id_fkey FOREIGN KEY (dispatcher_id) REFERENCES public.dispatchers(user_id) ON DELETE RESTRICT;


--
-- TOC entry 3884 (class 2606 OID 40557)
-- Name: orders orders_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(user_id) ON DELETE RESTRICT;


--
-- TOC entry 3885 (class 2606 OID 40562)
-- Name: orders orders_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(vehicle_id) ON DELETE RESTRICT;


--
-- TOC entry 3878 (class 2606 OID 40425)
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE;


--
-- TOC entry 3877 (class 2606 OID 40420)
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


-- Completed on 2025-10-30 12:50:19 +05

--
-- PostgreSQL database dump complete
--

