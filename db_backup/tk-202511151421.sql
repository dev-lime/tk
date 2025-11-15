--
-- PostgreSQL database dump
--

\restrict iCTclQ4O7Q5K0Z7e2TpjK2xxZJ3NTgUmwLeCh8L7qpmyUWKisCA9t1qVWvru37X

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-11-15 14:21:18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 858 (class 1247 OID 32770)
-- Name: order_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status_enum AS ENUM (
    'pending',
    'assigned',
    'in_transit',
    'delivered',
    'cancelled'
);


ALTER TYPE public.order_status_enum OWNER TO postgres;

--
-- TOC entry 861 (class 1247 OID 32782)
-- Name: vehicle_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.vehicle_status_enum AS ENUM (
    'available',
    'in_service',
    'maintenance',
    'unavailable'
);


ALTER TYPE public.vehicle_status_enum OWNER TO postgres;

--
-- TOC entry 229 (class 1255 OID 32791)
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
-- TOC entry 217 (class 1259 OID 32792)
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    user_id integer NOT NULL,
    company_name character varying(150)
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 32795)
-- Name: dispatchers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dispatchers (
    user_id integer NOT NULL
);


ALTER TABLE public.dispatchers OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 32798)
-- Name: drivers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drivers (
    user_id integer NOT NULL,
    license_number character varying(50) NOT NULL
);


ALTER TABLE public.drivers OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 32801)
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
    status public.order_status_enum DEFAULT 'pending'::public.order_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    delivery_date date,
    price numeric(10,2) NOT NULL,
    CONSTRAINT orders_price_check CHECK ((price > (0)::numeric))
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 32810)
-- Name: orders_order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_order_id_seq OWNER TO postgres;

--
-- TOC entry 4986 (class 0 OID 0)
-- Dependencies: 221
-- Name: orders_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_order_id_seq OWNED BY public.orders.order_id;


--
-- TOC entry 222 (class 1259 OID 32811)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    role_name character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 32814)
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_role_id_seq OWNER TO postgres;

--
-- TOC entry 4987 (class 0 OID 0)
-- Dependencies: 223
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- TOC entry 224 (class 1259 OID 32815)
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    user_id integer NOT NULL,
    role_id integer NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 32818)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character(60) NOT NULL,
    last_name character varying(100) NOT NULL,
    first_name character varying(100) NOT NULL,
    middle_name character varying(100),
    phone character varying(20),
    email character varying(150),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT users_email_check CHECK (((email)::text ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'::text)),
    CONSTRAINT users_phone_check CHECK (((phone)::text ~ '^\+?[0-9]{7,20}$'::text))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 32826)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 4988 (class 0 OID 0)
-- Dependencies: 226
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 227 (class 1259 OID 32827)
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicles (
    vehicle_id integer NOT NULL,
    plate_number character varying(20) NOT NULL,
    model character varying(100) NOT NULL,
    capacity_kg integer NOT NULL,
    status public.vehicle_status_enum DEFAULT 'available'::public.vehicle_status_enum
);


ALTER TABLE public.vehicles OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 32831)
-- Name: vehicles_vehicle_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vehicles_vehicle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vehicles_vehicle_id_seq OWNER TO postgres;

--
-- TOC entry 4989 (class 0 OID 0)
-- Dependencies: 228
-- Name: vehicles_vehicle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vehicles_vehicle_id_seq OWNED BY public.vehicles.vehicle_id;


--
-- TOC entry 4780 (class 2604 OID 32832)
-- Name: orders order_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN order_id SET DEFAULT nextval('public.orders_order_id_seq'::regclass);


--
-- TOC entry 4784 (class 2604 OID 32833)
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- TOC entry 4785 (class 2604 OID 32834)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 4787 (class 2604 OID 32835)
-- Name: vehicles vehicle_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles ALTER COLUMN vehicle_id SET DEFAULT nextval('public.vehicles_vehicle_id_seq'::regclass);


--
-- TOC entry 4969 (class 0 OID 32792)
-- Dependencies: 217
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (user_id, company_name) FROM stdin;
2	ООО Рога и Копыта
6	ООО ТестКлиент2
7	ИП Васильев
12	АО Транспорт+
13	ООО Логистика24
14	ИП Макаров
21	\N
\.


--
-- TOC entry 4970 (class 0 OID 32795)
-- Dependencies: 218
-- Data for Name: dispatchers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dispatchers (user_id) FROM stdin;
3
10
11
18
19
20
\.


--
-- TOC entry 4971 (class 0 OID 32798)
-- Dependencies: 219
-- Data for Name: drivers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.drivers (user_id, license_number) FROM stdin;
4	LIC1234567
8	LIC9876543
9	LIC1112223
15	LIC2223334
16	LIC3334445
17	LIC4445556
\.


--
-- TOC entry 4972 (class 0 OID 32801)
-- Dependencies: 220
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (order_id, client_id, dispatcher_id, driver_id, vehicle_id, origin, destination, cargo_description, weight_kg, status, created_at, updated_at, delivery_date, price) FROM stdin;
1	2	3	4	1	Москва, ул. Ленина, 1	Санкт-Петербург, Невский проспект, 10	Мебель	1200	pending	2025-09-20 22:51:27.379249	2025-09-20 22:51:27.379249	2025-10-01	15000.00
2	6	10	8	3	Казань, ул. Баумана, 5	Нижний Новгород, ул. Горького, 12	Строительные материалы	4500	assigned	2025-09-22 21:11:58.539507	2025-09-22 21:11:58.539507	2025-10-05	30000.00
3	7	11	9	4	Екатеринбург, ул. Мира, 8	Челябинск, пр. Ленина, 25	Металлоконструкции	15000	in_transit	2025-09-22 21:11:58.539507	2025-09-22 21:11:58.539507	2025-10-08	120000.00
4	12	18	15	7	Москва, Тверская 1	Санкт-Петербург, Невский 10	Продукты питания	18000	assigned	2025-09-23 11:31:21.407126	2025-09-23 11:31:21.407126	2025-10-12	95000.00
5	13	19	16	8	Ростов-на-Дону, Садовая 15	Краснодар, Северная 40	Мебель	12000	in_transit	2025-09-23 11:31:21.407126	2025-09-23 11:31:21.407126	2025-10-13	60000.00
7	12	18	15	10	Москва, Варшавское ш. 100	Тула, Советская 5	Документы	800	in_transit	2025-09-23 11:31:21.407126	2025-09-23 11:31:21.407126	2025-10-14	10000.00
8	13	19	16	11	Казань, Кремль 1	Ижевск, Удмуртская 20	Металлы	15000	pending	2025-09-23 11:31:21.407126	2025-09-23 11:31:21.407126	2025-10-15	110000.00
9	14	20	17	12	Екатеринбург, Малышева 50	Тюмень, Республики 33	Пластик	10000	assigned	2025-09-23 11:31:21.407126	2025-09-23 11:31:21.407126	2025-10-16	70000.00
10	12	18	16	7	Москва, Балаклавский пр-т 10	Рязань, Ленина 33	Бумага	17000	assigned	2025-09-23 11:31:21.407126	2025-09-23 11:31:21.407126	2025-10-17	80000.00
11	13	19	17	8	Воронеж, Московский пр. 12	Белгород, Победы 8	Фрукты	11000	in_transit	2025-09-23 11:31:21.407126	2025-09-23 11:31:21.407126	2025-10-18	50000.00
12	14	20	15	9	Чебоксары, Ленина 14	Йошкар-Ола, Гагарина 20	Компьютеры	3000	pending	2025-09-23 11:31:21.407126	2025-09-23 11:31:21.407126	2025-10-18	40000.00
13	12	18	16	10	Москва, Ленинградский пр-т 88	Калуга, Кирова 44	Одежда	1200	assigned	2025-09-23 11:31:21.407126	2025-09-23 11:31:21.407126	2025-10-19	15000.00
14	13	19	17	12	Саратов, Московская 7	Пенза, Карла Маркса 50	Химикаты	9500	in_transit	2025-09-23 11:31:21.407126	2025-09-23 11:31:21.407126	2025-10-20	65000.00
15	14	20	15	11	Нижний Новгород, Родионова 9	Владимир, Добросельская 100	Стекло	16000	pending	2025-09-23 11:31:21.407126	2025-09-23 11:31:21.407126	2025-10-21	105000.00
16	12	18	17	7	Москва, Кутузовский 30	Брянск, Дуки 12	Семена	18000	assigned	2025-09-23 11:31:21.407126	2025-09-23 11:31:21.407126	2025-10-22	85000.00
17	12	18	15	7	Москва, Варшавское ш. 10	Воронеж, Кирова 5	Продукты	15000	assigned	2025-09-23 11:31:21.738035	2025-09-23 11:31:21.738035	2025-10-23	75000.00
18	13	19	16	8	Саратов, Московская 20	Самара, Мичурина 44	Мебель	12000	in_transit	2025-09-23 11:31:21.738035	2025-09-23 11:31:21.738035	2025-10-24	60000.00
19	14	20	17	9	Ростов-на-Дону, Красная 7	Краснодар, Ленина 90	Бытовая техника	5000	pending	2025-09-23 11:31:21.738035	2025-09-23 11:31:21.738035	2025-10-25	45000.00
20	12	18	16	10	Москва, Ленинградский 50	Тула, Октябрьская 8	Одежда	2000	delivered	2025-09-23 11:31:21.738035	2025-09-23 11:31:21.738035	2025-10-25	18000.00
21	13	19	17	12	Нижний Новгород, Белинского 14	Киров, Советская 22	Стройматериалы	8000	assigned	2025-09-23 11:31:21.738035	2025-09-23 11:31:21.738035	2025-10-26	50000.00
22	14	20	15	11	Екатеринбург, Малышева 30	Челябинск, Кирова 60	Металлы	16000	in_transit	2025-09-23 11:31:21.738035	2025-09-23 11:31:21.738035	2025-10-27	105000.00
23	12	18	17	7	Москва, Кутузовский 100	Смоленск, Ленина 12	Бумага	17000	pending	2025-09-23 11:31:21.738035	2025-09-23 11:31:21.738035	2025-10-28	82000.00
24	13	19	15	8	Волгоград, Пушкина 45	Астрахань, Советская 17	Фрукты	10000	assigned	2025-09-23 11:31:21.738035	2025-09-23 11:31:21.738035	2025-10-29	48000.00
25	14	20	16	9	Чебоксары, Гагарина 10	Йошкар-Ола, Волкова 5	Компьютеры	2500	assigned	2025-09-23 11:31:21.738035	2025-09-23 11:31:21.738035	2025-10-29	38000.00
26	12	18	15	10	Москва, Тверская 15	Рязань, Советская 20	Химикаты	1100	cancelled	2025-09-23 11:31:21.738035	2025-09-23 11:31:21.738035	2025-10-30	12000.00
27	13	19	17	12	Казань, Кремль 3	Ижевск, Удмуртская 44	Пластик	9500	in_transit	2025-09-23 11:31:21.738035	2025-09-23 11:31:21.738035	2025-10-31	63000.00
28	14	20	15	11	Омск, Ленина 77	Новосибирск, Красный пр. 15	Одежда	12000	assigned	2025-09-23 11:31:21.738035	2025-09-23 11:31:21.738035	2025-11-01	55000.00
29	12	18	16	7	Москва, Проспект Мира 101	Белгород, Победы 12	Семена	18000	delivered	2025-09-23 11:31:21.738035	2025-09-23 11:31:21.738035	2025-11-02	87000.00
6	14	20	17	9	Самара, Ленина 22	Уфа, Октября 55	Бытовая техника	3500	assigned	2025-09-23 11:31:21.407126	2025-11-15 01:15:17.694692	2025-10-14	45000.00
\.


--
-- TOC entry 4974 (class 0 OID 32811)
-- Dependencies: 222
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (role_id, role_name) FROM stdin;
1	admin
2	client
3	driver
4	dispatcher
\.


--
-- TOC entry 4976 (class 0 OID 32815)
-- Dependencies: 224
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (user_id, role_id) FROM stdin;
1	1
2	2
3	4
4	3
6	2
7	2
8	3
9	3
10	4
11	4
12	2
13	2
14	2
15	3
16	3
17	3
18	4
19	4
20	4
21	2
\.


--
-- TOC entry 4977 (class 0 OID 32818)
-- Dependencies: 225
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, username, password_hash, last_name, first_name, middle_name, phone, email, created_at) FROM stdin;
1	admin1	$2y$10$4W2brtSjPd7iRE9XyR45x.zN6ToByA5JPdQhLf9TEskoe0UClM62K	Иванов	Админ	\N	+79990000001	admin@example.com	2025-09-20 22:51:27.328327
2	client1	$2y$10$4W2brtSjPd7iRE9XyR45x.zN6ToByA5JPdQhLf9TEskoe0UClM62K	Петров	Клиент	\N	+79990000002	client@example.com	2025-09-20 22:51:27.328327
3	dispatcher1	$2y$10$4W2brtSjPd7iRE9XyR45x.zN6ToByA5JPdQhLf9TEskoe0UClM62K	Сидоров	Диспетчер	\N	+79990000003	dispatcher@example.com	2025-09-20 22:51:27.328327
4	driver1	$2y$10$4W2brtSjPd7iRE9XyR45x.zN6ToByA5JPdQhLf9TEskoe0UClM62K	Кузнецов	Водитель	\N	+79990000004	driver@example.com	2025-09-20 22:51:27.328327
6	client2	$2a$12$abcdefghijklmnopqrstuv1234567890abcdefghiJKLmnOP     	Смирнов	Андрей	\N	+79990000006	client2@example.com	2025-09-22 21:11:58.448555
7	client3	$2a$12$abcdefghijklmnopqrstuv1234567890abcdefghiJKLmnOP     	Васильев	Денис	Сергеевич	+79990000007	client3@example.com	2025-09-22 21:11:58.448555
8	driver2	$2a$12$abcdefghijklmnopqrstuv1234567890abcdefghiJKLmnOP     	Попов	Никита	\N	+79990000008	driver2@example.com	2025-09-22 21:11:58.448555
9	driver3	$2a$12$abcdefghijklmnopqrstuv1234567890abcdefghiJKLmnOP     	Новиков	Максим	\N	+79990000009	driver3@example.com	2025-09-22 21:11:58.448555
10	dispatcher2	$2a$12$abcdefghijklmnopqrstuv1234567890abcdefghiJKLmnOP     	Фёдоров	Олег	\N	+79990000010	dispatcher2@example.com	2025-09-22 21:11:58.448555
11	dispatcher3	$2a$12$abcdefghijklmnopqrstuv1234567890abcdefghiJKLmnOP     	Морозов	Игорь	Александрович	+79990000011	dispatcher3@example.com	2025-09-22 21:11:58.448555
12	client4	$2a$12$abcdefghijklmnopqrstuv1234567890abcdefghiJKLmnOP     	Егоров	Илья	\N	+79990000012	client4@example.com	2025-09-23 11:31:20.990547
13	client5	$2a$12$abcdefghijklmnopqrstuv1234567890abcdefghiJKLmnOP     	Кузнецов	Антон	Игоревич	+79990000013	client5@example.com	2025-09-23 11:31:20.990547
14	client6	$2a$12$abcdefghijklmnopqrstuv1234567890abcdefghiJKLmnOP     	Макаров	Пётр	\N	+79990000014	client6@example.com	2025-09-23 11:31:20.990547
15	driver4	$2a$12$abcdefghijklmnopqrstuv1234567890abcdefghiJKLmnOP     	Белов	Сергей	\N	+79990000015	driver4@example.com	2025-09-23 11:31:20.990547
16	driver5	$2a$12$abcdefghijklmnopqrstuv1234567890abcdefghiJKLmnOP     	Гусев	Владимир	\N	+79990000016	driver5@example.com	2025-09-23 11:31:20.990547
17	driver6	$2a$12$abcdefghijklmnopqrstuv1234567890abcdefghiJKLmnOP     	Соловьёв	Алексей	Викторович	+79990000017	driver6@example.com	2025-09-23 11:31:20.990547
18	dispatcher4	$2a$12$abcdefghijklmnopqrstuv1234567890abcdefghiJKLmnOP     	Волков	Степан	\N	+79990000018	dispatcher4@example.com	2025-09-23 11:31:20.990547
19	dispatcher5	$2a$12$abcdefghijklmnopqrstuv1234567890abcdefghiJKLmnOP     	Зайцев	Георгий	\N	+79990000019	dispatcher5@example.com	2025-09-23 11:31:20.990547
20	dispatcher6	$2a$12$abcdefghijklmnopqrstuv1234567890abcdefghiJKLmnOP     	Сергеев	Валерий	\N	+79990000020	dispatcher6@example.com	2025-09-23 11:31:20.990547
21	new	$2y$10$pxLt7CNPf.BtLvHiJ6oH6O99U6FVw4rZnvbV2y.Bwy.ZcSa2T7Uty	u	h	i	\N	\N	2025-09-24 23:20:29.855408
\.


--
-- TOC entry 4979 (class 0 OID 32827)
-- Dependencies: 227
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicles (vehicle_id, plate_number, model, capacity_kg, status) FROM stdin;
1	A111AA77	Газель Next	1500	available
2	B222BB77	MAN TGX	20000	available
3	C333CC77	Hyundai HD78	5000	available
4	D444DD77	Volvo FH	18000	available
5	E555EE77	Mercedes Sprinter	3000	in_service
6	F666FF77	КАМАЗ 5490	20000	maintenance
7	G777GG77	Scania R500	20000	available
8	H888HH77	MAN TGS	15000	available
9	I999II77	Isuzu NQR	4000	available
10	J111JJ77	Газель Next	1500	available
11	K222KK77	DAF XF	18000	maintenance
12	L333LL77	Volvo FM	12000	available
\.


--
-- TOC entry 4990 (class 0 OID 0)
-- Dependencies: 221
-- Name: orders_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_order_id_seq', 29, true);


--
-- TOC entry 4991 (class 0 OID 0)
-- Dependencies: 223
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 4, true);


--
-- TOC entry 4992 (class 0 OID 0)
-- Dependencies: 226
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 21, true);


--
-- TOC entry 4993 (class 0 OID 0)
-- Dependencies: 228
-- Name: vehicles_vehicle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vehicles_vehicle_id_seq', 12, true);


--
-- TOC entry 4793 (class 2606 OID 32837)
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4795 (class 2606 OID 32839)
-- Name: dispatchers dispatchers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispatchers
    ADD CONSTRAINT dispatchers_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4797 (class 2606 OID 32841)
-- Name: drivers drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4799 (class 2606 OID 32843)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- TOC entry 4801 (class 2606 OID 32845)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 4803 (class 2606 OID 32847)
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- TOC entry 4805 (class 2606 OID 32849)
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- TOC entry 4807 (class 2606 OID 32851)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4809 (class 2606 OID 32853)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4811 (class 2606 OID 32855)
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (vehicle_id);


--
-- TOC entry 4813 (class 2606 OID 32857)
-- Name: vehicles vehicles_plate_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_plate_number_key UNIQUE (plate_number);


--
-- TOC entry 4823 (class 2620 OID 32858)
-- Name: orders trg_update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_orders_updated_at();


--
-- TOC entry 4814 (class 2606 OID 32859)
-- Name: clients clients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4815 (class 2606 OID 32864)
-- Name: dispatchers dispatchers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispatchers
    ADD CONSTRAINT dispatchers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4816 (class 2606 OID 32869)
-- Name: drivers drivers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4817 (class 2606 OID 32874)
-- Name: orders orders_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(user_id) ON DELETE RESTRICT;


--
-- TOC entry 4818 (class 2606 OID 32879)
-- Name: orders orders_dispatcher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_dispatcher_id_fkey FOREIGN KEY (dispatcher_id) REFERENCES public.dispatchers(user_id) ON DELETE RESTRICT;


--
-- TOC entry 4819 (class 2606 OID 32884)
-- Name: orders orders_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(user_id) ON DELETE RESTRICT;


--
-- TOC entry 4820 (class 2606 OID 32889)
-- Name: orders orders_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(vehicle_id) ON DELETE RESTRICT;


--
-- TOC entry 4821 (class 2606 OID 32894)
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE;


--
-- TOC entry 4822 (class 2606 OID 32899)
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


-- Completed on 2025-11-15 14:21:18

--
-- PostgreSQL database dump complete
--

\unrestrict iCTclQ4O7Q5K0Z7e2TpjK2xxZJ3NTgUmwLeCh8L7qpmyUWKisCA9t1qVWvru37X

