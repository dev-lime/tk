--
-- PostgreSQL database dump
--

\restrict 1rZfUaqvjiHW8GeLQtlBT1dvjOz2S8e269FOCV3cfBDQN00xmtndJ0OCNSvVxXZ

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-11-27 12:30:02

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
-- TOC entry 863 (class 1247 OID 17017)
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
-- TOC entry 866 (class 1247 OID 17028)
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
-- TOC entry 245 (class 1255 OID 17156)
-- Name: cancel_order(integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cancel_order(p_order_id integer, p_cancelled_by text DEFAULT 'system'::text) RETURNS TABLE(success boolean, message text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_current_status TEXT;
BEGIN
    -- Получаем текущий статус
    SELECT status INTO v_current_status
    FROM orders 
    WHERE order_id = p_order_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Order not found';
        RETURN;
    END IF;

    IF v_current_status = 'cancelled' THEN
        RETURN QUERY SELECT false, 'Order is already cancelled';
        RETURN;
    END IF;

    -- Обновляем статус заказа
    UPDATE orders 
    SET 
        status = 'cancelled',
        updated_at = CURRENT_TIMESTAMP
    WHERE order_id = p_order_id;

    -- Добавляем запись в историю
    INSERT INTO order_history (order_id, action, description, created_by)
    VALUES (p_order_id, 'cancelled', 'Order cancelled by ' || p_cancelled_by, p_cancelled_by);

    RETURN QUERY SELECT true, 'Order cancelled successfully';
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT false, 'Error cancelling order: ' || SQLERRM;
END;
$$;


ALTER FUNCTION public.cancel_order(p_order_id integer, p_cancelled_by text) OWNER TO postgres;

--
-- TOC entry 243 (class 1255 OID 17154)
-- Name: get_drivers_list(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_drivers_list() RETURNS TABLE(user_id integer, first_name text, last_name text, license_number text, availability text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.user_id, 
        u.first_name, 
        u.last_name, 
        d.license_number,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM orders 
                WHERE driver_id = d.user_id 
                AND status IN ('assigned', 'in_transit')
            ) THEN 'busy'
            ELSE 'available'
        END as availability
    FROM drivers d 
    JOIN users u ON d.user_id = u.user_id 
    ORDER BY u.first_name, u.last_name;
END;
$$;


ALTER FUNCTION public.get_drivers_list() OWNER TO postgres;

--
-- TOC entry 241 (class 1255 OID 17152)
-- Name: get_order_details(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_order_details(p_order_id integer) RETURNS TABLE(order_id integer, origin text, destination text, description text, weight numeric, status text, price numeric, created_at timestamp without time zone, updated_at timestamp without time zone, delivery_date date, client_name text, client_email text, client_phone text, company_name text, driver_id integer, driver_name text, driver_license text, vehicle_id integer, vehicle_plate text, vehicle_model text, vehicle_capacity numeric, vehicle_status text, dispatcher_id integer, dispatcher_name text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.order_id,
        o.origin,
        o.destination,
        o.cargo_description as description,
        o.weight_kg as weight,
        o.status,
        o.price,
        o.created_at,
        o.updated_at,
        o.delivery_date,
        CONCAT(u.first_name, ' ', u.last_name) as client_name,
        u.email as client_email,
        u.phone as client_phone,
        c.company_name,
        d.user_id as driver_id,
        CONCAT(driver_u.first_name, ' ', driver_u.last_name) as driver_name,
        d.license_number as driver_license,
        v.vehicle_id,
        v.plate_number as vehicle_plate,
        v.model as vehicle_model,
        v.capacity_kg as vehicle_capacity,
        v.status as vehicle_status,
        disp.user_id as dispatcher_id,
        CONCAT(disp_u.first_name, ' ', disp_u.last_name) as dispatcher_name
    FROM orders o 
    JOIN clients c ON o.client_id = c.user_id
    JOIN users u ON c.user_id = u.user_id 
    LEFT JOIN drivers d ON o.driver_id = d.user_id
    LEFT JOIN users driver_u ON d.user_id = driver_u.user_id
    LEFT JOIN vehicles v ON o.vehicle_id = v.vehicle_id
    LEFT JOIN dispatchers disp ON o.dispatcher_id = disp.user_id
    LEFT JOIN users disp_u ON disp.user_id = disp_u.user_id
    WHERE o.order_id = p_order_id;
END;
$$;


ALTER FUNCTION public.get_order_details(p_order_id integer) OWNER TO postgres;

--
-- TOC entry 244 (class 1255 OID 17155)
-- Name: get_vehicles_list(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_vehicles_list() RETURNS TABLE(vehicle_id integer, plate_number text, model text, capacity_kg numeric, status text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.vehicle_id, 
        v.plate_number, 
        v.model, 
        v.capacity_kg, 
        v.status
    FROM vehicles v 
    ORDER BY v.model, v.plate_number;
END;
$$;


ALTER FUNCTION public.get_vehicles_list() OWNER TO postgres;

--
-- TOC entry 242 (class 1255 OID 17153)
-- Name: update_order(integer, text, text, text, numeric, text, numeric, date, integer, integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_order(p_order_id integer, p_origin text DEFAULT NULL::text, p_destination text DEFAULT NULL::text, p_cargo_description text DEFAULT NULL::text, p_weight_kg numeric DEFAULT NULL::numeric, p_status text DEFAULT NULL::text, p_price numeric DEFAULT NULL::numeric, p_delivery_date date DEFAULT NULL::date, p_driver_id integer DEFAULT NULL::integer, p_vehicle_id integer DEFAULT NULL::integer, p_updated_by text DEFAULT 'system'::text) RETURNS TABLE(success boolean, message text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_current_status TEXT;
    v_old_driver_id INTEGER;
    v_old_vehicle_id INTEGER;
BEGIN
    -- Получаем текущие значения
    SELECT status, driver_id, vehicle_id 
    INTO v_current_status, v_old_driver_id, v_old_vehicle_id
    FROM orders 
    WHERE order_id = p_order_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Order not found';
        RETURN;
    END IF;

    -- Обновляем заказ
    UPDATE orders 
    SET 
        origin = COALESCE(p_origin, origin),
        destination = COALESCE(p_destination, destination),
        cargo_description = COALESCE(p_cargo_description, cargo_description),
        weight_kg = COALESCE(p_weight_kg, weight_kg),
        status = COALESCE(p_status, status),
        price = COALESCE(p_price, price),
        delivery_date = COALESCE(p_delivery_date, delivery_date),
        driver_id = p_driver_id,
        vehicle_id = p_vehicle_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE order_id = p_order_id;

    -- Добавляем запись в историю
    INSERT INTO order_history (order_id, action, description, created_by)
    VALUES (
        p_order_id, 
        'updated', 
        COALESCE(
            'Order updated by ' || p_updated_by || 
            CASE 
                WHEN p_status IS NOT NULL AND p_status != v_current_status THEN 
                    ', status changed from ' || v_current_status || ' to ' || p_status
                ELSE ''
            END ||
            CASE 
                WHEN p_driver_id IS DISTINCT FROM v_old_driver_id THEN
                    ', driver ' || 
                    CASE 
                        WHEN p_driver_id IS NULL THEN 'unassigned'
                        WHEN v_old_driver_id IS NULL THEN 'assigned to ' || p_driver_id
                        ELSE 'changed from ' || v_old_driver_id || ' to ' || p_driver_id
                    END
                ELSE ''
            END,
            'Order details updated by ' || p_updated_by
        ),
        p_updated_by
    );

    RETURN QUERY SELECT true, 'Order updated successfully';
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT false, 'Error updating order: ' || SQLERRM;
END;
$$;


ALTER FUNCTION public.update_order(p_order_id integer, p_origin text, p_destination text, p_cargo_description text, p_weight_kg numeric, p_status text, p_price numeric, p_delivery_date date, p_driver_id integer, p_vehicle_id integer, p_updated_by text) OWNER TO postgres;

--
-- TOC entry 229 (class 1255 OID 17037)
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
-- TOC entry 217 (class 1259 OID 17038)
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    user_id integer NOT NULL,
    company_name character varying(150)
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 17041)
-- Name: dispatchers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dispatchers (
    user_id integer NOT NULL
);


ALTER TABLE public.dispatchers OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 17044)
-- Name: drivers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drivers (
    user_id integer NOT NULL,
    license_number character varying(50) NOT NULL
);


ALTER TABLE public.drivers OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 17047)
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
-- TOC entry 221 (class 1259 OID 17056)
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
-- TOC entry 4890 (class 0 OID 0)
-- Dependencies: 221
-- Name: orders_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_order_id_seq OWNED BY public.orders.order_id;


--
-- TOC entry 222 (class 1259 OID 17057)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    role_name character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 17060)
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
-- TOC entry 4891 (class 0 OID 0)
-- Dependencies: 223
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- TOC entry 224 (class 1259 OID 17061)
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    user_id integer NOT NULL,
    role_id integer NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 17064)
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
-- TOC entry 226 (class 1259 OID 17072)
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
-- TOC entry 4892 (class 0 OID 0)
-- Dependencies: 226
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 227 (class 1259 OID 17073)
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
-- TOC entry 228 (class 1259 OID 17077)
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
-- TOC entry 4893 (class 0 OID 0)
-- Dependencies: 228
-- Name: vehicles_vehicle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vehicles_vehicle_id_seq OWNED BY public.vehicles.vehicle_id;


--
-- TOC entry 4684 (class 2604 OID 17078)
-- Name: orders order_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN order_id SET DEFAULT nextval('public.orders_order_id_seq'::regclass);


--
-- TOC entry 4688 (class 2604 OID 17079)
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- TOC entry 4689 (class 2604 OID 17080)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 4691 (class 2604 OID 17081)
-- Name: vehicles vehicle_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles ALTER COLUMN vehicle_id SET DEFAULT nextval('public.vehicles_vehicle_id_seq'::regclass);


--
-- TOC entry 4873 (class 0 OID 17038)
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
\.


--
-- TOC entry 4874 (class 0 OID 17041)
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
-- TOC entry 4875 (class 0 OID 17044)
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
-- TOC entry 4876 (class 0 OID 17047)
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
-- TOC entry 4878 (class 0 OID 17057)
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
-- TOC entry 4880 (class 0 OID 17061)
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
\.


--
-- TOC entry 4881 (class 0 OID 17064)
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
\.


--
-- TOC entry 4883 (class 0 OID 17073)
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
-- TOC entry 4894 (class 0 OID 0)
-- Dependencies: 221
-- Name: orders_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_order_id_seq', 29, true);


--
-- TOC entry 4895 (class 0 OID 0)
-- Dependencies: 223
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 4, true);


--
-- TOC entry 4896 (class 0 OID 0)
-- Dependencies: 226
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 21, true);


--
-- TOC entry 4897 (class 0 OID 0)
-- Dependencies: 228
-- Name: vehicles_vehicle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vehicles_vehicle_id_seq', 12, true);


--
-- TOC entry 4697 (class 2606 OID 17083)
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4699 (class 2606 OID 17085)
-- Name: dispatchers dispatchers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispatchers
    ADD CONSTRAINT dispatchers_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4701 (class 2606 OID 17087)
-- Name: drivers drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4703 (class 2606 OID 17089)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- TOC entry 4705 (class 2606 OID 17091)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 4707 (class 2606 OID 17093)
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- TOC entry 4709 (class 2606 OID 17095)
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- TOC entry 4711 (class 2606 OID 17097)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4713 (class 2606 OID 17099)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4715 (class 2606 OID 17101)
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (vehicle_id);


--
-- TOC entry 4717 (class 2606 OID 17103)
-- Name: vehicles vehicles_plate_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_plate_number_key UNIQUE (plate_number);


--
-- TOC entry 4727 (class 2620 OID 17104)
-- Name: orders trg_update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_orders_updated_at();


--
-- TOC entry 4718 (class 2606 OID 17105)
-- Name: clients clients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4719 (class 2606 OID 17110)
-- Name: dispatchers dispatchers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispatchers
    ADD CONSTRAINT dispatchers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4720 (class 2606 OID 17115)
-- Name: drivers drivers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4721 (class 2606 OID 17120)
-- Name: orders orders_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(user_id) ON DELETE RESTRICT;


--
-- TOC entry 4722 (class 2606 OID 17125)
-- Name: orders orders_dispatcher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_dispatcher_id_fkey FOREIGN KEY (dispatcher_id) REFERENCES public.dispatchers(user_id) ON DELETE RESTRICT;


--
-- TOC entry 4723 (class 2606 OID 17130)
-- Name: orders orders_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(user_id) ON DELETE RESTRICT;


--
-- TOC entry 4724 (class 2606 OID 17135)
-- Name: orders orders_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(vehicle_id) ON DELETE RESTRICT;


--
-- TOC entry 4725 (class 2606 OID 17140)
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE;


--
-- TOC entry 4726 (class 2606 OID 17145)
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


-- Completed on 2025-11-27 12:30:03

--
-- PostgreSQL database dump complete
--

\unrestrict 1rZfUaqvjiHW8GeLQtlBT1dvjOz2S8e269FOCV3cfBDQN00xmtndJ0OCNSvVxXZ

